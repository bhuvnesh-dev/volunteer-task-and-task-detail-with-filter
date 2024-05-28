import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,],
  providers: [Storage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChipsComponent  implements OnInit {

  @Input() tag: any = '';
  @Input() status: any;
  @Input() activeBGColor: any;
  @Input() activeTextColor: any;
  @Input() defaultBGColor: any;
  @Input() defaultTextColor: any;

  chipsArray: any = ["Support", "Want Sign", "Interest in Donation", "News Letter", "Volunter", "Support", "Want Sign", "Interest in Donation", "News Letter", "Volunter"]
  selectedChips: any = [];
  constructor() { }

  chipsSelected(i:any) {
    if (this.selectedChips.includes(i)) {
      let chip = this.selectedChips.indexOf(i)
      this.selectedChips.splice(chip, 1)

    } else {
      this.selectedChips.push(i)
    }
  }

  activeoption(i:any) {
    return this.selectedChips.includes(i)
  }

  ngOnInit() {}

  getBGColor() {
    const BGColor = this.status === '1' && this.activeBGColor ? this.activeBGColor :
      this.status === '0' && this.defaultBGColor ? this.defaultBGColor : this.status === '1' ? '#2196F3' : '#FFFFFF';
    return BGColor;
  }

  getTextColor() {
    const TextColor = this.status === '1' && this.activeTextColor ? this.activeTextColor :
      this.status === '0' && this.defaultTextColor ? this.defaultTextColor : this.status === '1' ? '#FFFFFF' : '#000000';
    return TextColor;
  }

}
