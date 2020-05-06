import { Component, ViewChild } from '@angular/core';
import { LighthouseService } from './lighthouse.service';
import { concat } from 'rxjs';
import { DataSource } from '@angular/cdk/table';
import { MatTable } from '@angular/material/table';

const STRATEGY = 'mobile';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  urls = '';
  uniqueUrl = '';
  splittedUrls: string[] = [];
  promises = [];
  dataSource = [];
  defaultFilenName = 'lighthouse-results.csv';
  loading = false;
  completed = false;
  testRepeated = false;
  repeatCounter = 1;
  observables = [];
  displayedColumns = ['url',
                      'score',
                      'strategy',
                      'Dom-Size',
                      'First-Contentful-Paint',
                      'First-Meaningful-Paint',
                      'Speed-Index',
                      'First-CPU-Idle',
                      'Time-to-Interactive',
                      'Estimated-Input-Latency'
                    ];
  @ViewChild(MatTable) table: MatTable<any>;

  constructor(private lighthouse: LighthouseService) {}

  logUrls() {
    this.clearArrays();
    this.splittedUrls = this.urls.split('\n');
    this.loading = true;

    this.splittedUrls.map((url) => {
      const res = this.lighthouse.testUrl(url, STRATEGY).then(
        data => {
          this.dataSource.push(this.formatData(data));
          this.table.renderRows();
        },
        error => console.log('something went wrong')
      );

      this.promises.push(res);
    });

    Promise.all(this.promises).then(data => {
      this.loading = false;
      this.completed = true;
    });
  }

  logUniqueUrl() {
    this.clearArrays();
    this.loading = true;
    this.repeatCounter = this.repeatCounter > 20 ? 20 : this.repeatCounter;

    let i: number;
    for (i = 0; i < this.repeatCounter; i++) {
      this.observables.push(this.lighthouse.testSequential(this.uniqueUrl, STRATEGY));
    }

    concat(...this.observables).subscribe(
      data => {
        this.dataSource.push(this.formatData(data));
        this.table.renderRows();
      },
      err => {
        alert(err.message);
        this.loading = false;
      },
      () => {
        this.loading = false;
        this.completed = true;
      }
    );
  }

  private clearArrays() {
    this.splittedUrls.length = 0;
    this.promises.length = 0;
    this.observables.length = 0;
    this.dataSource.length = 0;
    this.completed = false;
  }

  private formatData(response) {
    return {
      'url': decodeURI(response.lighthouseResult.requestedUrl),
      'score': Math.round(response.lighthouseResult.categories.performance.score * 100),
      'strategy': STRATEGY,
      'Dom-Size': response.lighthouseResult.audits['dom-size'].numericValue,
      'First-Contentful-Paint' : parseFloat(response.lighthouseResult.audits['first-contentful-paint'].displayValue.replace('s', '')),
      'First-Meaningful-Paint': parseFloat(response.lighthouseResult.audits['first-meaningful-paint'].displayValue.replace('s', '')),
      'Speed-Index': parseFloat(response.lighthouseResult.audits['speed-index'].displayValue.replace('s', '')),
      'First-CPU-Idle': parseFloat(response.lighthouseResult.audits['first-cpu-idle'].displayValue.replace('s', '')),
      'Time-to-Interactive': parseFloat(response.lighthouseResult.audits['interactive'].displayValue.replace('s', '')),
      'Estimated-Input-Latency': parseFloat(response.lighthouseResult.audits['estimated-input-latency'].displayValue.replace('ms', '')),
    };
  }


  exportCSV(responses) {
    const csvContent = this.createCSVContent(responses);
    this.downloadCSV(csvContent);
  }

  private createCSVContent(responses) {
    console.log(responses);
    const keys = Object.keys(responses[0]);
    const values = responses.map(el => Object.values(el).join(',')).join('\n');
    const csvContent = keys + '\n' + values;

    return csvContent;
  }

  private downloadCSV(csvContent, filename = this.defaultFilenName) {
    const a = document.createElement('a');
    const mimeType = 'application/octet-stream';

    a.href = URL.createObjectURL(new Blob([csvContent], { type: mimeType }));
    a.setAttribute('download', filename);

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log(`Downloading ${filename}`);
  }
}
