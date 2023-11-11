import multer from 'multer';
import { DESTINATION } from '../config';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const storage = multer.diskStorage({
  destination(req: Request, file: Express.Multer.File, cb: DestinationCallback) {
    cb(null, DESTINATION);
  },
  filename(req: Request, file: Express.Multer.File, cb: FileNameCallback) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sections = file.originalname.split('.');
    const extension = sections[sections.length - 1];
    cb(null, `${uuidv4()}.${extension}`);
  },
});

export default multer({ storage: storage });
