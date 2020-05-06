import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay } from 'rxjs/operators';

const KEY = 'AIzaSyA0QCqgmdXM32p-Qjs535W59003dycPd3s';
const CATEGORY = 'performance';

@Injectable({
  providedIn: 'root'
})
export class LighthouseService {

  constructor(private http: HttpClient) {

  }

  testUrl(url: string, strategy: string) {
    return this.http
                .get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=${strategy}&key=${KEY}`)
                .toPromise();
  }

  testSequential(url: string, strategy: string) {
    return this.http.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&category=${CATEGORY}&strategy=${strategy}&key=${KEY}`)
                .pipe(delay(2000));
  }
}
