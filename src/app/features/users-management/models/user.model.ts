import { Contact } from "./contact.model";
import { Info } from "./info.model";

export class User {
    
    "id":number;
     
    "email": string;

    "role": string; 

    "status": string;

    "createdAt": Date;

    "info": Info;

    "contact": Contact;

}