import { Component, Input, OnInit } from '@angular/core';

import { ContributorService } from '../../contributor.service';


@Component({
  selector: 'event-page-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  @Input() event: any = null;
  @Input() contributors: any = null;

  constructor (public contributorService: ContributorService) { }

  ngOnInit () {
  }

}
