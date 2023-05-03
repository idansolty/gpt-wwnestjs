import { AxiosResponse } from "axios";

export class OaiResponse<T> {
    response?: T;
    error?: any;
}