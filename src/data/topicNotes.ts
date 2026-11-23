import { TopicNote } from './noteTypes';
import { MODULE_1_NOTES } from './module1Notes';
import { MODULE_2_NOTES } from './module2Notes';
import { MODULE_3_NOTES } from './module3Notes';
import { MODULE_4_NOTES } from './module4Notes';
import { MODULE_5_NOTES } from './module5Notes';

export const ALL_TOPIC_NOTES: TopicNote[] = [
  ...MODULE_1_NOTES,
  ...MODULE_2_NOTES,
  ...MODULE_3_NOTES,
  ...MODULE_4_NOTES,
  ...MODULE_5_NOTES,
];

export const TOPIC_NOTES_BY_ID: Record<string, TopicNote> = Object.fromEntries(
  ALL_TOPIC_NOTES.map((note) => [note.topicId, note])
);
