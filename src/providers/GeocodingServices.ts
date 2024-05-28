import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
declare var google: any;
@Injectable()
export class GeocodingService {
  private geocoder: any;

  constructor() {
    this.geocoder = new google.maps.Geocoder();
  }
  reverseGeocode(latitude: any, longitude: any): Observable<any> {
    return new Observable<any>((observer) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      observer.next(url);
      observer.complete()
    });
  }
  geocodeAddress(address: string): Observable<any> {
    return new Observable<any>((observer) => {
      this.geocoder.geocode({ address: address }, (results:any, status:any) => {
        if (status === google.maps.GeocoderStatus.OK) {
          var latitude = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
          var result = {latitude,longitude}
          observer.next(result);
          observer.complete();
        } else {
          observer.error(status);
        }
      });
    });
  }
}
