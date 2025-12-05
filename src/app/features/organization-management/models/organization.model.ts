import { Department } from "./department.model";
import { PriorityArea } from "./priorityArea.model";

export class Organization {
    "code": string;
    "name": string;
    "motto": string;
    "logo": string;
    "isActive": boolean;
    "departments": Array<Department>;
    "priorityAreas": Array<PriorityArea>
}