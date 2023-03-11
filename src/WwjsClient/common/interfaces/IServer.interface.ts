import { INestApplication } from "@nestjs/common/interfaces";

export interface IServer {
    start: (app: INestApplication) => void;
}