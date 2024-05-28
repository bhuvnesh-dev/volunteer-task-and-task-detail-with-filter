import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskDetailPageRoutingModule } from './task-detail-routing.module';

import { TaskDetailPage } from './task-detail.page';
import { ChipsComponent } from '../components/chips/chips.component';
import { GeocodingService } from 'src/providers/GeocodingServices';
import { Storage } from '@ionic/storage-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskDetailPageRoutingModule,
    ChipsComponent
  ],
  declarations: [TaskDetailPage],
  providers: [GeocodingService,Storage,InAppBrowser,],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
})
export class TaskDetailPageModule {}
