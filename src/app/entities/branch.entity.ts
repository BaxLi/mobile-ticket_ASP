import { PositionEntity } from "./position.entity";

export class BranchEntity {
   id: string;
   name: string = '';
   address: string;
   distance: string;
   rawDistance: number;
   enabled: boolean;
   position: PositionEntity;
   timeZone?: string;
}
