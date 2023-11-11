import { QuestionController } from './question/question.controller';
import { CommentController } from './comment/comment.controller';

const loadControllers = () => {
  return [QuestionController, CommentController];
};

export default loadControllers;
