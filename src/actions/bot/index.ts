"use server"

import { client } from '@/lib/prisma'
import { extractEmailsFromString, extractURLfromString } from '@/lib/utils'
import { onRealTimeChat } from '../conversation'
import { clerkClient } from '@clerk/nextjs'
import { onMailer } from '../mailer'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const onStoreConversations = async (
  id: string,
  message: string,
  role: 'assistant' | 'user'
) => {
  await client.chatRoom.update({
    where: {
      id,
    },
    data: {
      message: {
        create: {
          message,
          role,
        },
      },
    },
  })
}

export const onGetCurrentChatBot = async (id: string) => {
  try {
    const chatbot = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        helpdesk: true,
        name: true,
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
            icon: true,
            textColor: true,
            background: true,
            helpdesk: true,
          },
        },
      },
    })

    if (chatbot) {
      return chatbot
    }
  } catch (error) {
    console.log(error)
  }
}

// let customerEmail: string | undefined

export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: 'assistant' | 'user'; content: string }[],
  author: 'user',
  message: string
) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: { id },
      select: {
        name: true,
        filterQuestions: {
          where: { answered: null },
          select: { question: true },
        },
      },
    });

    if (chatBotDomain) {
      const extractedEmail = extractEmailsFromString(message);
      let customerEmail = extractedEmail ? extractedEmail[0] : null;

      if (customerEmail) {
        const checkCustomer = await client.domain.findUnique({
          where: { id },
          select: {
            User: { select: { clerkId: true } },
            name: true,
            customer: {
              where: { email: { startsWith: customerEmail } },
              select: {
                id: true,
                email: true,
                questions: true,
                chatRoom: {
                  select: { id: true, live: true, mailed: true },
                },
              },
            },
          },
        });

        // Create a new customer if not found
        if (checkCustomer && !checkCustomer.customer.length) {
          const newCustomer = await client.domain.update({
            where: { id },
            data: {
              customer: {
                create: {
                  email: customerEmail,
                  questions: { create: chatBotDomain.filterQuestions },
                  chatRoom: { create: {} },
                },
              },
            },
          });

          if (newCustomer) {
            console.log('New customer created');
            const response = {
              role: 'assistant',
              content: `Welcome aboard ${
                customerEmail.split('@')[0]
              }! I'm glad to connect with you. How can I assist you today?`,
            };
            return { response };
          }
        }

        // Handle live chat and mailing
        if (checkCustomer && checkCustomer.customer[0].chatRoom[0].live) {
          await onStoreConversations(
            checkCustomer.customer[0].chatRoom[0].id,
            message,
            author
          );

          onRealTimeChat(
            checkCustomer.customer[0].chatRoom[0].id,
            message,
            'user',
            author
          );

          if (!checkCustomer.customer[0].chatRoom[0].mailed) {
            const user = await clerkClient.users.getUser(
              checkCustomer.User?.clerkId!
            );

            onMailer(user.emailAddresses[0].emailAddress);

            // Update mail status to prevent spamming
            await client.chatRoom.update({
              where: { id: checkCustomer.customer[0].chatRoom[0].id },
              data: { mailed: true },
            });

            return {
              live: true,
              chatRoom: checkCustomer.customer[0].chatRoom[0].id,
            };
          }
          return {
            live: true,
            chatRoom: checkCustomer.customer[0].chatRoom[0].id,
          };
        }

        // Store conversation and generate AI response
        await onStoreConversations(
          checkCustomer?.customer[0].chatRoom[0].id!,
          message,
          author
        );

        console.log('Fetched Customer ID:', checkCustomer?.customer[0].id);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Enhanced AI Prompt
        const prompt = `
          You are an AI assistant for ${chatBotDomain.name}. Your primary role is to guide the customer through a series of predefined questions to understand their needs and provide relevant assistance. Follow these rules strictly:

          1. **Predefined Questions**: Use the following questions to guide the conversation:
             - ${chatBotDomain.filterQuestions
               .map((q) => q.question)
               .join('\n             - ')}

          2. **Keyword Usage**:
             - Append the keyword "(complete)" at the end of every question you ask from the predefined list.
             - Append the keyword "(realtime)" if the customer says something inappropriate or out of context, and inform them that a real agent will take over.

          3. **Respectful Tone**: Always maintain a professional and respectful tone.

          4. **Redirects**:
             - If the customer agrees to book an appointment, provide this link: https://corinna-ai-saas.vercel.app/portal/${id}/appointment/${checkCustomer?.customer[0].id}
             - If the customer wants to buy a product, redirect them to the payment page: https://corinna-ai-saas.vercel.app/portal/${id}/payment/${checkCustomer?.customer[0].id}

          5. **Out-of-Scope Queries**: If the customer asks something beyond your capabilities, politely inform them and add the keyword "(realtime)" to escalate the conversation to a human agent.

          Current conversation context:
          ${chat.map((c) => `${c.role}: ${c.content}`).join('\n')}
        `;

        const result = await model.generateContent([prompt, ...chat.map(c => c.content), message]);
        const responseText = await result.response.text();

        // Handle realtime escalation
        if (responseText.includes('(realtime)')) {
          await client.chatRoom.update({
            where: { id: checkCustomer?.customer[0].chatRoom[0].id },
            data: { live: true },
          });

          const response = {
            role: 'assistant',
            content: responseText.replace('(realtime)', ''),
          };

          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id!,
            response.content,
            'assistant'
          );

          return { response };
        }

        // Handle completed questions
        if (chat[chat.length - 1].content.includes('(complete)')) {
          const firstUnansweredQuestion = await client.customerResponses.findFirst({
            where: { customerId: checkCustomer?.customer[0].id, answered: null },
            select: { id: true },
            orderBy: { question: 'asc' },
          });

          if (firstUnansweredQuestion) {
            await client.customerResponses.update({
              where: { id: firstUnansweredQuestion.id },
              data: { answered: message },
            });
          }
        }

        // Handle generated links
        if (responseText) {
          const generatedLink = extractURLfromString(responseText);

          if (generatedLink) {
            const link = generatedLink[0];
            const response = {
              role: 'assistant',
              content: `Great! You can follow the link to proceed: ${link}`,
              link: link,
            };

            await onStoreConversations(
              checkCustomer?.customer[0].chatRoom[0].id!,
              response.content,
              'assistant'
            );

            return { response };
          }

          const response = {
            role: 'assistant',
            content: responseText,
          };

          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id!,
            response.content,
            'assistant'
          );

          return { response };
        }
      }

      // Handle new customers without an email
      console.log('No customer email provided');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
        You are a knowledgeable and friendly sales representative for ${chatBotDomain.name}. Your goal is to welcome the customer warmly and naturally guide the conversation to collect their email address. Be respectful and maintain a professional tone throughout.

        Current conversation context:
        ${chat.map((c) => `${c.role}: ${c.content}`).join('\n')}
      `;

      const result = await model.generateContent([prompt, ...chat.map(c => c.content), message]);
      const responseText = await result.response.text();

      if (responseText) {
        const response = {
          role: 'assistant',
          content: responseText,
        };

        return { response };
      }
    }
  } catch (error) {
    console.log(error);
  }
};