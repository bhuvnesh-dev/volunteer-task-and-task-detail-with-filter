import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { GeocodingService } from 'src/providers/GeocodingServices';
import { InfiniteScrollCustomEvent, IonContent, IonInput, IonModal, NavController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { marker } from 'leaflet';
import * as votersJsonData from '../../jsonData/taskBasedVotersData.json';
import * as votersFilterData from '../../jsonData/voterFilterTags.json';
import * as voterStatusData from '../../jsonData/voterStatusData.json';
import { OverlayEventDetail } from '@ionic/core/components';

declare var L: any;
declare var google: any
@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
})
export class TaskDetailPage implements OnInit {
  @ViewChild('searchData') searchData!: IonInput;
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  @ViewChild('autoComplete') autoComplete!: IonInput;
  @ViewChild(IonModal) modal!: IonModal;
  name!: string;
  map!: L.Map;
  mapView: boolean = false
  accessToken: string = 'pk.eyJ1IjoiYmh1dm5lc2gtdXB3b3JrZGV2IiwiYSI6ImNsMzhjYTNjNTAwNHIzaXFrNXVydGd0bnkifQ.PXqs_rSmj74pk1TXFdE5bg'
  showMapBox: boolean = false;
  spinner: boolean = false;
  taskId!: number;
  areaName: boolean = false;
  show: boolean = false;
  showStatusId: number = 0;
  votersData: any = [];
  filteredVotersData: any = [];
  accordianList: any = [];
  tagsList: any = [];
  pageNo: number = 0;
  totalVoters!: number;
  totalFinalVoters!: number;
  infiniteScrollingDisabled: boolean = false;
  color: any = "#e00101";
  isShowHouseHold: boolean = false;
  houseHoldSelectedValue: string = "voter";
  oddEvenSelectedValue: string = "all";
  selectedFiltersList: any = [];
  editPermission: number = 0;
  selectedFilters: any;
  chipsTags:any;
  @ViewChild(IonContent) content!: IonContent;
  viewSubFilter: boolean = false;
  parentActiveOption!: number;
  initialActiveFilterOption!: number | null;
  streetOddEvenSubFilters = ["All", "Odd", "Even"]
  filteredData : any;
  constructor(
    private route: ActivatedRoute,
    public storage: Storage,
    private router: Router,
    private geoServices: GeocodingService,
    private inAppBrowser: InAppBrowser,
    private navCtrl: NavController,
  ) { storage.create()}

  async ngOnInit() {
    const id: any = this.route.snapshot.params["id"];
    await this.storage.set("taskId", id);
    this.editPermission = await this.storage.get("voterEditPermission");
    this.taskId = id;
    this.pageNo = 0;
    this.getFilterChipsData();
    this.getVotersDetails();
    this.getStatus();
  }

  @HostListener('document:click', ['$event'])

  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    const isAccordion = targetElement.closest('.accordian');
    const isInsideAccordion = targetElement.closest('.accordianList');
    if (!isAccordion && !isInsideAccordion) {
      this.showStatusId = 0;
    }
  }

  viewSubFilterFunc(Option:any , index:any){
    this.viewSubFilter=true;
    this.parentActiveOption = index;
    this.initialActiveFilterOption = null;
    this.chipsTags = [Option];
  }
  async getFilterChipsData() {
    const getFiltersChips = this.selectedFilters;
    if(getFiltersChips){
      const array = [];
      for (const key in getFiltersChips) {
        if (getFiltersChips.hasOwnProperty(key)) {
          array.push(...getFiltersChips[key]);
        }
      }
      this.selectedFiltersList = new Set(array)
    }
  }

  async editVoterFormOpen (voters:any) {
    await this.storage.set("voterDataForEdit",voters);
    this.router.navigate(['/edit-voter'])
  }

  async deleteFilter(valueToRemove:any) {
    const newFilteredData = [...this.selectedFiltersList];
    const index = newFilteredData.indexOf(valueToRemove);
    if (index > -1) {
      newFilteredData.splice(index, 1);
    }
    this.selectedFiltersList = newFilteredData;
    const votersFilter = this.selectedFilters;
    for (const prop in votersFilter) {
      if (Array.isArray(votersFilter[prop])) {
        votersFilter[prop] = votersFilter[prop].filter((value:any) => value !== valueToRemove);
      }
    }
    this.commonFilterFunction()
  }

  async getVotersDetails(forceRefresh: boolean = false, ev?: any) {
    const jsonDataNew = JSON.stringify(votersJsonData);
    const votersData = JSON.parse(jsonDataNew);
    const jsonData = JSON.stringify(votersFilterData);
    const filterData = JSON.parse(jsonData);
    this.filteredData = filterData?.data[this.taskId]
    console.log(votersData.data[this.taskId],"VotersData");
    this.totalVoters = votersData.data[this.taskId].length;
    this.totalFinalVoters = votersData.data[this.taskId].length;
    const result = [...this.votersData, ...votersData.data[this.taskId]];
    const newArray = result.reduce((accumulator, obj) => {
      if (!accumulator[obj.id]) {
        accumulator[obj.id] = obj;
      }
      return accumulator;
    }, {});
    const uniqueArray = Object.values(newArray);
    this.votersData = uniqueArray;
    this.spinner = false;
    if (this.houseHoldSelectedValue === "house_hold") {
      const resultantData = [...this.votersData]
      await this.filterDataBasedOnAttributes(resultantData);
      this.handleShowHouseHold(this.filteredVotersData);
    }
    else {
      const resultantData = [...this.filteredVotersData, ...votersData.data[this.taskId]]
      if (this.oddEvenSelectedValue === "odd") {
        this.filteredVotersData = resultantData.filter((item) => item?.street_no % 2 === 1)
      }
      else if (this.oddEvenSelectedValue === "even") {
        this.filteredVotersData = resultantData.filter((item) => item?.street_no % 2 === 0)
      }
      else {
        this.filteredVotersData = resultantData;
      }
      this.filterDataBasedOnAttributes(this.filteredVotersData);
    }
  }

  scrollToTop() {
    this.content.scrollToTop();
  }

  async showMap(type:boolean){
    this.mapView=type
    if(type){
      --this.pageNo;
      this.spinner = true;
      await this.getVotersDetails();
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(this.name, 'confirm');
    this.commonFilterFunction();
  }

  commonFilterFunction(){
    this.getFilterChipsData();
    let finalFilterData = this.votersData;
    for(const keys in this.selectedFilters){
      if(this.selectedFilters[keys].length > 0){
        finalFilterData = finalFilterData.filter((item:any)=>this.selectedFilters[keys].includes(item[keys]))
      }
    }
    this.filteredVotersData = finalFilterData;
  }

  openMap(item:any) {
    let address = item.address + " " + item.postal_code
    if(item?.latitude && item?.longitude){
      const data ={latitude: item.latitude, longitude: item.longitude, address:address }
      this.storage.set('selectedDestination', data)
      this.router.navigate(['task-details-map-view'])
      this.storage.set('sameAddressVoters', [item]);
    }
    else{
      this.geoServices.geocodeAddress(address).subscribe(res => {
        const data ={latitude: res.latitude, longitude: res.longitude, address:address }
        this.storage.set('selectedDestination', data)
        this.router.navigate(['task-details-map-view'])
        this.storage.set('sameAddressVoters', [item]);
      })
    }
  }

  handleOddEvenFilter(event:any) {
    let resultedData = [...this.votersData];
    this.oddEvenSelectedValue = event.detail.value;
    if (event.detail.value === "odd") {
      resultedData = resultedData.filter((item) => item?.street_no % 2 === 1)
      if (this.isShowHouseHold) {
        this.handleShowHouseHold(resultedData)
      }
    }
    if (event.detail.value === "even") {
      resultedData = resultedData.filter((item) => item?.street_no % 2 === 0)
      if (this.isShowHouseHold) {
        this.handleShowHouseHold(resultedData)
      }
    }
    if (!this.isShowHouseHold) {
      this.totalVoters = this.totalFinalVoters;
    }
    this.filteredVotersData = resultedData;
    this.filterDataBasedOnAttributes(resultedData)
    if (this.isShowHouseHold) {
      this.handleShowHouseHold(resultedData)
    }
  }

  handleViewFilter(event:any) {
    if (event.detail.value === "house_hold") {
      this.handleShowHouseHold(this.filteredVotersData);
    }
    else {
      this.isShowHouseHold = false;
      this.mapView = false;
      this.filteredVotersData = this.votersData;
      this.filterDataBasedOnAttributes(this.filteredVotersData);
      this.totalVoters = this.totalFinalVoters;
    }
    this.houseHoldSelectedValue = event.detail.value;
  }

  handleShowHouseHold(resultedData:any) {
    let finalFilteredData = resultedData;
    if (this.oddEvenSelectedValue === "odd") {
      finalFilteredData = resultedData.filter((item:any) => item?.street_no % 2 === 1)
    }
    if (this.oddEvenSelectedValue === "even") {
      finalFilteredData = resultedData.filter((item:any) => item?.street_no % 2 === 0)
    }
    const result = finalFilteredData.reduce((acc:any, obj:any) => {
      const index = acc.findIndex((item:any) => item?.address === obj?.address + " " + obj?.postal_code);
      if (index !== -1) {
        acc[index].totalVoters++;
      } else {
        acc.push({ totalVoters: 1, address: obj?.address + " " + obj?.postal_code, latitude: obj?.latitude, longitude: obj?.longitude });
      }
      return acc;
    }, []);
    this.filteredVotersData = result;
    this.totalVoters = result?.length;
    this.isShowHouseHold = true;
    this.getAllVotersOnMap(result)
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
    this.inAppBrowser.create(url, '_system', options);
  }
  async getAllVotersOnMap(result?:any) {
    const destination1Icon = L.icon({
      iconUrl: '../../assets/destination.svg',
      iconSize: [41, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    this.map = L.map('map', {
      attributionControl: false,
      zoom: 10,
      minZoom: 4,
      renderer: L.canvas(),
    })
    var layer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      accessToken: this.accessToken,
    });
    layer.addTo(this.map)
    setTimeout(() => {
      this.map.invalidateSize(true)
    }, 1000);
    for (const item of result) {
      if(item?.latitude && item?.longitude){
        this.map.setView([item.latitude, item.longitude], 12);
        let markers = marker([item.latitude, item.longitude], { icon: destination1Icon }).addTo(this.map).addEventListener('click',()=>{
          this.showAllVoters(item)
        })
      }
      else{
        this.geoServices.geocodeAddress(item.address).subscribe(res => {
          this.map.setView([res.latitude, res.longitude], 12);
          let markers = marker([res.latitude, res.longitude], { icon: destination1Icon }).addTo(this.map).addEventListener('click',()=>{
            this.showAllVoters(item)
          })
        })
      }
    }
  }

  async getStatus() {
    const jsonDataNew = JSON.stringify(voterStatusData);
    const statusData = JSON.parse(jsonDataNew);
    this.accordianList = statusData.taskstatus;
  }

  ShowStatusList(id: number) {
    this.showStatusId = id;
  }
  async ChangeStatus(value: string, id: number, indexNumber: number) {
    this.filteredVotersData[indexNumber].task_status = value;
    this.showStatusId = 0;
  }

  async updateAttributes(item:any, voterId:any, attributeIndex:any, indexNumber:any) {
    this.filteredVotersData[indexNumber].attributeData[attributeIndex].status = item?.status === 1 ? 0 : 1;
  }

  handleInput(inputData: any) {
    const filterSearchData = () => {
      const searchFilterData = this.votersData?.filter((item:any) => {
        if (item?.first_name?.toLowerCase()?.includes(inputData.toLowerCase())) return item;
        if (item?.last_name?.toLowerCase()?.includes(inputData.toLowerCase())) return item;
        if (item?.address?.toLowerCase()?.includes(inputData.toLowerCase())) return item;
        if (item?.civic_district?.toLowerCase()?.includes(inputData.toLowerCase())) return item;
        if (item?.postal_code?.toLowerCase()?.includes(inputData.toLowerCase())) return item;
        if (item?.street_name?.toLowerCase()?.includes(inputData.toLowerCase())) return item;
      });
      this.filteredVotersData = searchFilterData;
    }
    const debounceDropdown = this.debounce(filterSearchData, 500);
    debounceDropdown();
  }

  async filterDataBasedOnAttributes(data:any) {
    const attributeFilter = await this.storage.get("attributeFilterKey");
    if (attributeFilter && attributeFilter !== "Total Voters") {
      let filteredArray = data.filter((obj:any) =>
        obj.attributeData?.some((attr:any) => attr.status === 1 && attr.attr_name=== attributeFilter)
      );
      if (this.oddEvenSelectedValue === "odd") {
        filteredArray = filteredArray.filter((item:any) => item?.street_no % 2 === 1)
      }
      else if (this.oddEvenSelectedValue === "even") {
        filteredArray = filteredArray.filter((item:any) => item?.street_no % 2 === 0)
      }
      this.totalVoters = this.totalFinalVoters;
      this.filteredVotersData = filteredArray;
    }
    else {
      this.filteredVotersData = data;
    }
  }

  debounce(func:any, timeout = 300) {
    let timer: any;
    return (...args: any) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  async showAllVoters(combineVotersData:any) {
    const sameAddressVoters = this.votersData.filter((item:any) => item?.address + " " + item?.postal_code === combineVotersData?.address);
    await this.storage.set("sameAddressVoters", sameAddressVoters);
    this.router.navigate(["/same-address-voters"]);
  }

  goBack(){
    this.navCtrl.back()
  }

  async onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      await this.storage.set("VotersFilter",this.selectedFilters);
    }
  }
  async removeFilters(){
    this.selectedFilters = {};
    await this.storage.remove("VotersFilter");
    await this.storage.remove("attributeFilterKey");
  }

  selectSubFilter(selectedFilter:any,selectChip:any){
    if(this.selectedFilters?.[selectedFilter]){
      if(this.selectedFilters[selectedFilter].includes(selectChip)){
        this.selectedFilters[selectedFilter] = this.selectedFilters[selectedFilter].filter((value:any) => value !== selectChip);
      }
      else{
        this.selectedFilters[selectedFilter].push(selectChip)
      }
    }
    else{
      const obj = {[selectedFilter]: [selectChip]}
      this.selectedFilters = {...this.selectedFilters,...obj}
    }
  }
}
