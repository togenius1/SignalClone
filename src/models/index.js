// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const MessageStatus = {
  "SENT": "SENT",
  "DELIVERED": "DELIVERED",
  "READ": "READ"
};

const { Message, ChatRoom, User, ChatRoomUser } = initSchema(schema);

export {
  Message,
  ChatRoom,
  User,
  ChatRoomUser,
  MessageStatus
};