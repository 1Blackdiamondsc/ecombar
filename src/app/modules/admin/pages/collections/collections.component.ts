import { Component, OnInit } from '@angular/core';
import { CollectionService } from '../../../shared/services/collection.service';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-admin-collections',
  providers: [CollectionService],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss', '../../../../../table.scss', '../../../../../button.scss']
})
export class CollectionsComponent implements OnInit{
    collections: any;
    constructor(
      private userServ: UserService,
      private authServ: AuthService,
      private router: Router,
      private collectionServ: CollectionService) {
    }

    ngOnInit() {
      this.userServ.getToken().subscribe(
        (token: any) => {
          const decoded = this.authServ.decodeToken(token);
          const aud = decoded.aud;
          const merchantId = decoded.merchantId;
  
          if (aud == 'isSystemAdmin') {
            this.getAdminCollections();
          }  else 
          if (merchantId) {
            this.getMerchantCollections(merchantId);
          }
        } 
      );
    }

    getMerchantCollections(merchantId: string) {
      this.collectionServ.getMerchantCollections(merchantId).subscribe(
        (res: any) => {
          if(res && res.ok) {
            this.collections = res._body;
          }
        }
      );
    }  
  
    getAdminCollections() {
      this.collectionServ.getAdminCollections().subscribe(
        (res: any) => {
          if(res && res.ok) {
            this.collections = res._body;
          }
        }
      );
    }
  
    editCollection(collection) {
      this.router.navigate(['/admin/collection/' + collection._id + '/edit']);
    }

    deleteCollection(collection) {
      this.collectionServ.deleteCollection(collection._id).subscribe(
        (res: any) => {
          if(res && res.ok) {
            this.collections = this.collections.filter((item) => item._id != collection._id);
          }
        }
      );
    }      
}