import { ReviewController } from "./review/review.controller";
import { CommentController } from './comment/comment.controller';

const loadControllers = () => {
  return [
    ReviewController,
    CommentController
  ];
}

export default loadControllers;
