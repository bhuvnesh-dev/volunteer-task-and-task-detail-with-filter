import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, IonDatetime, IonInput, IonModal, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { Geolocation } from '@capacitor/geolocation';
import { ChartData, ChartEvent, ChartType, Chart, TooltipItem, ChartConfiguration, ChartOptions } from 'chart.js';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';
import * as jsonData from '../../jsonData/taskData.json';
import * as taskTypeJsonData from '../../jsonData/taskType.json';

declare var google: any;
@Component({
  selector: 'app-task',
  templateUrl: './task.page.html',
  styleUrls: ['./task.page.scss'],
})
export class TaskPage implements OnInit {

  @ViewChild('autoComplete') autoComplete!: IonInput;
  @ViewChild('datePicker') datetime!: IonDatetime;
  @ViewChild(IonModal) modal!: IonModal;
  // @ViewChild('sectionSelect') sectionSelect : Select;
  selectedFilters: any;
  name: string = '';
  address: string = "";
  spinner: boolean = false;
  chart!: Chart;
  areaName: boolean = false;
  show: boolean = false;
  showId: number = 0;
  currentDateTime: any = "";
  selectedDate: string = '';
  showCalender: boolean = false;
  datebutton: boolean = true; selId: any;
  selectable: boolean = false;
  userId: string = "";
  descriptionValur: any;
  private apiCalled = false;
  currentDate: string = new Date().toISOString();
  taskTypeFilter:any=["All"];
  streetList: any = [{ streetName: "Wall Street" },
  { streetName: "Wall Street" },
  { streetName: "Wall Street" }]

  allTaskData: any[] = [];
  filteredTaskData: any[] = [];
  addresses: any = [{ streetName: "Working on", isActive: "false" }, { streetName: "Main Street", isActive: "false" },
  { streetName: "Licon Street", isActive: "true" }, { streetName: "Boulevard Street", isActive: "false" },
  { streetName: "Main Street", isActive: "false" }, { streetName: "Boulevard Street", isActive: "false" }]
  geoencoderOptions: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5
  };
  filterSelectedOption:string="";
  public doughnutChartData: ChartData<'doughnut'> = {
    datasets: [
      {
        data: [20, 80],
        backgroundColor: ["#00CE78", "#EBEBEB"]
      },
    ]
  };
  public doughnutChartType: ChartType = 'doughnut';
  public chartOptions: ChartOptions = {
      animation: {
        duration: 0 // Set the duration to 0 to disable animation
      }
  };
  selectedTypeFilter: any;
  profile: string = '';
  candidateName: any;
  toastIsOpen: boolean = false;
  color: string = "red";
  toastMessage: string = "";

  constructor(
    public datepipe: DatePipe,
    public storage: Storage,
    public router: Router,
    // public backendServices: BackendService,
    private nativeGeocoder: NativeGeocoder,
    private sanitizer: DomSanitizer,
    private alertController: AlertController,
    private openNativeSettings: OpenNativeSettings,
    private inAppBrowser: InAppBrowser,
    // private apiService: ApiService, 
    // private cachingService: CachingService, 
    private loadingController: LoadingController
  ) {
    storage.create();
    this.currentDateTime = this.datepipe.transform((new Date));
  }
  async ngOnInit() {
      const candidateData = await this.storage.get("CandidateDetails");
      this.profile = candidateData?.profile ? "https://pollcity.projectsofar.info/storage/user-images/" + candidateData?.profile : 'https://pollcity.projectsofar.info/storage/user-images/1683036390.giorgio.jpg'
      this.candidateName = candidateData?.candidate_name;
      this.taskTypeFilter = ["All"]
      this.getTaskType();
      // const candidateData = await this.storage.get("CandidateDetails");
      // if(candidateData){
        this.router.events.subscribe(async (event:any) => {
          if (event instanceof NavigationEnd) {
            const currentUrl = event.url;
            if (currentUrl === '/tabs/tab1') {
              this.getTaskData();
            }
          }
        });
      // }
  }

  async setVoterUpdatePermission(tasks:any) {
    // const filteredData = tasks.filter((item:any)=> item?.vol_user_id === this.userId);
    // await this.storage.set("voterEditPermission",filteredData[0].permission);
  }

  async ionViewWillEnter() {
    const candidateData = await this.storage.get("CandidateDetails");
    this.profile = candidateData?.profile ? "https://pollcity.projectsofar.info/storage/user-images/" + candidateData?.profile : 'https://pollcity.projectsofar.info/storage/user-images/1683036390.giorgio.jpg'
    this.candidateName = candidateData?.candidate_name;
    this.filteredTaskData = [];
    this.allTaskData = [];
    this.getTaskData();
  }
  async getCurrentLocation() {
    this.toastIsOpen = false;
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = coordinates.coords;
    this.nativeGeocoder.reverseGeocode(latitude, longitude, this.geoencoderOptions)
      .then((result: NativeGeocoderResult[]) => {
        const addressData: any = result[0];
        this.address = `${addressData?.thoroughfare}, ${addressData?.subLocality}, ${addressData?.locality}, ${addressData?.administrativeArea}, ${addressData?.countryName}`;
        this.autoComplete.value = this.address;
      })
      .catch((error: any) => console.log(error));
    } catch (error) {
      const alert = await this.alertController.create({
        header: 'Location Access Required',
        message: 'Please enable location access to use this feature.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Location prompt cancelled');
            }
          },
          {
            text: 'Enable',
            handler: () => {
              this.openNativeSettings.open('location');
            }
          }
        ]
      });
      await alert.present();
    }
    
  };
  onCancel() {
    this.showCalender = false;
  }
  async handleRefresh(event:any) {
    const candidateData = await this.storage.get("CandidateDetails");
    this.profile = candidateData.profile ? "https://pollcity.projectsofar.info/storage/user-images/" + candidateData.profile : 'https://pollcity.projectsofar.info/storage/user-images/1683036390.giorgio.jpg'
    this.candidateName = candidateData?.candidate_name;
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
      this.getTaskData();
    }, 2000);
  }

  generateAddress(addressObj:any) {
    let obj = [];
    let address = "";
    for (let key in addressObj) {
      obj.push(addressObj[key]);
    }
    obj.reverse();
    for (let val in obj) {
      if (obj[val].length)
        address += obj[val] + ', ';
    }
    return address.slice(0, -2);
  }

  async ionViewDidEnter() {
    await this.autoComplete.getInputElement().then((ref: any) => {
      const autoComplete = new google.maps.places.Autocomplete(ref);
      autoComplete.addListener('place_changed', () => {
        const address = autoComplete.getPlace().formatted_address;
        this.address = address;
      });
    })
  }

  async updateAddress() {
    this.spinner = true;
    // const userData = await this.storage.get("UserData");
    // const candidateData = await this.storage.get("CandidateDetails");
    // this.userId = userData?.id;
    // this.backendServices.updateCurrentAddress({volunteer_id: userData?.id,candidate_id:candidateData?.id,working_status:this.address}, userData?.token).subscribe({
    //   next: async (data:any) => {
    //     if (data?.success) {
    //       await this.cachingService.updateTaskData(this.address,userData?.id);
    //       this.getTaskData();
    //     }
    //     else {
    //       this.spinner = false;
    //     }
    //   },
    //   error: (error:any) => {
    //     this.spinner = false;
    //   }
    // })
  }
  updateDoughnutChartData(value:any) {
    return this.doughnutChartData = {
      datasets: [
        {
          data: [value, 100 - value],
          backgroundColor: ["#00CE78", "#EBEBEB"]
        },
      ]
    }
  }

  async getTaskData() {
      // this.spinner = true;
      const jsonDataNew = JSON.stringify(jsonData);
      const taskData = JSON.parse(jsonDataNew);
      console.log(taskData,"taskData");
      this.allTaskData = taskData?.data?.taskdata;
      this.filteredTaskData = taskData?.data?.taskdata;
      setTimeout(() => {
        this.ionViewDidEnter();
      }, 2000);
      // const userData = await this.storage.get("UserData");
      // const candidateData = await this.storage.get("CandidateDetails");
      // this.userId = userData?.id;
      // if(candidateData){
      //   this.apiService.getCommonData("/task",userData?.token,{volunteer_id: userData?.id,candidate_id:candidateData?.id},).subscribe({
      //     next: (data:any) => {
      //       if (data?.success) {
      //         console.log(data?.data?.taskdata,"taskdatataskdata");
      //         this.allTaskData = data?.data?.taskdata;
      //         this.filteredTaskData = data?.data?.taskdata;
      //         this.spinner = false;
      //         setTimeout(() => {
      //           this.ionViewDidEnter();
      //         }, 2000);
      //       }
      //       else {
      //         this.spinner = false;
      //       }
      //     },
      //     error: (error:any) => {
      //       this.spinner = false;
      //     }
      //   })
      // }
      // else{
      //   this.allTaskData = [];
      //   this.filteredTaskData = [];
      //   this.spinner = false;
      // }
  }

  async getTaskType(){
    const jsonDataNew = JSON.stringify(taskTypeJsonData);
    const taskTypeData = JSON.parse(jsonDataNew);
    this.taskTypeFilter = ["All"];
    this.taskTypeFilter.push(...taskTypeData?.data)
  }

  dateFormat(dateString: string) {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit"
    });
    return formattedDate;
  }

  initialDate() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    return formattedDate;
  }

  sortById(data: any) {
    return data.sort((a:any, b:any) => {
      if (a.vol_user_id === this.userId) {
        return -1;
      } else if (b.vol_user_id === this.userId) {
        return 1;
      } else {
        return a.vol_user_id - b.vol_user_id;
      }
    });
  }

  async onLogOut() {
    this.storage.clear().then(() => {
      this.router.navigate(['/login'])
    })
  }

  public chartClicked({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }


  openDatePicker() {
    const datePicker = document.getElementById('datePicker');
    datePicker?.click(); // Programmatically trigger the date picker
    this.showCalender = true;
    this.datebutton = false;
  }

  onDateSelected(event:any) {
    this.spinner = true;
    if (event.detail.value) {
      const date = new Date(event.detail.value);
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      const DateFilteredData = this.allTaskData.filter((item) => new Date(item.Taskdetails[0]?.created_at).getDate() <= new Date(date).getDate());
      if(this.selectedTypeFilter === "All" || !this.selectedTypeFilter){
        this.filteredTaskData = DateFilteredData;
        this.selectedDate = formattedDate;
      }
      else{
        const filteredTypeData = DateFilteredData.filter((item)=>{
          return item?.Taskdetails[0]?.tasktype === this.selectedTypeFilter;
        });
        this.filteredTaskData = filteredTypeData;
        this.selectedDate = formattedDate;
      }
      
    }
    this.showCalender = false;
    this.spinner = false;
  }
  showAreaName() {
    this.areaName = true
  }
  showDescription(id: number) {
    // if (this.show !== true) {
    //   this.show = !this.show;
    //   this.showId = id;
    // } 
    if (this.showId === id) {
      this.show = !this.show;
      // this.showId = id;
    } else {
      if (this.show === true) {
        this.show = this.show;
        this.showId = id;
      } else {
        this.show = !this.show;
        this.showId = id;
      }
    }
  }
  selectedChip() {
    // this.selId=i;
    this.selectable = true
  }

  setItem(item:any) {
    // this.descriptionValur = this.sanitizer.bypassSecurityTrustHtml(item)
    return this.sanitizer.bypassSecurityTrustHtml(item)
    // this.descriptionValur.slice(0, 140)
    // return this.descriptionValur
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(this.name, 'confirm');
  }
  optionSelect(event:any){
    let newData: string | number | Date;
    if(this.selectedDate){
      const [day, month, year] = this.selectedDate.split("/");
      newData = new Date(`${year}-${month}-${day}`);
    }
    if(event.target.value === "All"){
      if(this.selectedDate){
        const DateFilteredData = this.allTaskData.filter((item) => new Date(item.Taskdetails[0]?.created_at).getDate() <= new Date(newData).getDate());
        this.filteredTaskData = DateFilteredData;
      }
      else{
        this.filteredTaskData = this.allTaskData;
      }
    }
    else{
      if(this.selectedDate){
        const DateFilteredData = this.allTaskData.filter((item) => new Date(item.Taskdetails[0]?.created_at).getDate() <= new Date(newData).getDate());
        const filteredTypeData = DateFilteredData.filter((item)=>{
          return item?.Taskdetails[0]?.tasktype === event.target.value;
        });
        this.filteredTaskData = filteredTypeData;
      }
      else{
        const filteredTypeData = this.allTaskData.filter((item)=>{
          return item?.Taskdetails[0]?.tasktype === event.target.value;
        });
        this.filteredTaskData = filteredTypeData;
      }
      
    }
    this.selectedTypeFilter = event.target.value;
  }

  async removeFilters(){
    this.selectedFilters = {};
    await this.storage.get("VotersFilter");
  }

  async startChat(number:any){
    const options: InAppBrowserOptions = {
      location: 'yes',
      hidden: 'no',
      clearcache: 'yes',
      clearsessioncache: 'yes',
      zoom: 'yes',
      hardwareback: 'yes',
      mediaPlaybackRequiresUserAction: 'no',
      shouldPauseOnSuspend: 'no',
      fullscreen: 'yes',
    };
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(number)}`;
    console.log(number)
    this.inAppBrowser.create(url, '_system', options);
  }
}
