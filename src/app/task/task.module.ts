import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskPageRoutingModule } from './task-routing.module';

import { TaskPage } from './task.page';
import { NgChartsModule, NgChartsConfiguration } from 'ng2-charts';
import { NativeGeocoder } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';
import { Storage } from '@ionic/storage-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskPageRoutingModule,
    NgChartsModule
  ],
  providers: [NgChartsConfiguration,OpenNativeSettings,DatePipe,Storage,NativeGeocoder,InAppBrowser],
  declarations: [TaskPage]
})
export class TaskPageModule {}
