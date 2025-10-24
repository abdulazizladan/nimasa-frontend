import { Department } from "./department.model";

export class Organization {
    "code": string;
    "name": string;
    "motto": string;
    "logo": string;
    "isActive": boolean;
    "departments": Array<Department>;
}