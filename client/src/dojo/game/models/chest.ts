import { ComponentValue } from "@dojoengine/recs";
import chest1 from "/assets/chests/c1.png";
import chest2 from "/assets/chests/c2.png";
import chest3 from "/assets/chests/c3.png";
import chest4 from "/assets/chests/c4.png";
import chest5 from "/assets/chests/c5.png";
import chest6 from "/assets/chests/c6.png";
import chest7 from "/assets/chests/c7.png";
import chest8 from "/assets/chests/c8.png";
import chest9 from "/assets/chests/c9.png";
import chest10 from "/assets/chests/c10.png";

export class Chest {
  public id: number;
  public point_target: number;
  public points: number;
  public prize: bigint;

  constructor(chest: ComponentValue) {
    this.id = chest.id;
    this.point_target = chest.point_target;
    this.points = chest.points;
    this.prize = chest.prize;
  }

  public getIcon() {
    let icon = chest1;
    switch (this.id) {
      case 1:
        icon = chest10;
        break;
      case 2:
        icon = chest9;
        break;
      case 3:
        icon = chest8;
        break;
      case 4:
        icon = chest7;
        break;
      case 5:
        icon = chest6;
        break;
      case 6:
        icon = chest5;
        break;
      case 7:
        icon = chest4;
        break;
      case 8:
        icon = chest3;
        break;
      case 9:
        icon = chest2;
        break;
      case 10:
        icon = chest1;
        break;
    }
    return icon;
  }

  public getName() {
    let name = "Unknown";
    switch (this.id) {
      case 1:
        name = "Wood";
        break;
      case 2:
        name = "Bronze";
        break;
      case 3:
        name = "Iron";
        break;
      case 4:
        name = "Silver";
        break;
      case 5:
        name = "Gold";
        break;
      case 6:
        name = "Platinum";
        break;
      case 7:
        name = "Emerald";
        break;
      case 8:
        name = "Ruby";
        break;
      case 9:
        name = "Sapphire";
        break;
      case 10:
        name = "Diamond";
        break;
    }
    return name;
  }

  public isCompleted() {
    return this.points >= this.point_target;
  }
}
