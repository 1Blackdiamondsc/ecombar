import { Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { AddressService } from '../../shared/services/address.service';
import { OrderService } from '../../shared/services/order.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilService } from '../../shared/services/util.service';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { IddockService } from '../../shared/services/iddock.service';
import { NgxSmartModalService } from 'ngx-smart-modal';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss', '../../../../select.scss', '../../../../button.scss']
})
export class AddressComponent implements OnInit {
  name: string;
  suite: string;
  streetNumber: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postcode: string;
  country: string;
  order: any;
  id: string;
  orderID: string;
  noWallet: boolean;
  password: string;
  wallets: any;
  wallet: any;

  constructor(
    private iddockServ: IddockService,
    private utilServ: UtilService,
    private ngxSmartModalServ: NgxSmartModalService,    
    private localSt: LocalStorage,
    private router: Router,
    private route: ActivatedRoute,
    private userServ: UserService,
    private orderServ: OrderService,
    private addressServ: AddressService) {

  }

  ngOnInit() {

    this.localSt.getItem('ecomwallets').subscribe((wallets: any) => {

      if(!wallets || (wallets.length == 0)) {
        this.noWallet = true;
        return;
      }
      this.wallets = wallets;
      console.log('this.wallets==', this.wallets);
      this.wallet = this.wallets.items[this.wallets.currentIndex];
    });  

    this.orderID = this.route.snapshot.paramMap.get('orderID');
    this.orderServ.get(this.orderID).subscribe(
      (res: any) => {
        if(res && res.ok) {
          this.order = res._body;
          console.log('this.order====', this.order);
        }
      }
    );
    this.userServ.getMe().subscribe(
      (res: any) => {
        console.log('resme==', res);
        if (res && res.ok) {
          const member = res._body;
          if (member.homeAddressId) {
            this.id = member.homeAddressId;
            this.addressServ.getAddress(member.homeAddressId).subscribe(
              (res: any) => {
                console.log('res for addressss=', res);
                if (res && res.ok) {
                  const address = res._body;
                  this.name = address.name;
                  this.suite = address.suite;
                  this.streetNumber = address.streetNumber;
                  this.street = address.street;
                  this.district = address.district;
                  this.city = address.city;
                  this.province = address.province;
                  this.postcode = address.postcode;
                  this.country = address.country;
                  console.log('res  for address=', res);
                }
              }
            );
          }
        }

      }
    );
  }

  updateOrderAddress() {
    this.ngxSmartModalServ.getModal('passwordModal').open();

  }

  onConfirmPassword(event) {
      this.ngxSmartModalServ.getModal('passwordModal').close();
      this.password = event;
      this.updateOrderAddressDo();     
  }  


  async updateOrderAddressDo() {
    const seed = this.utilServ.aesDecryptSeed(this.wallet.encryptedSeed, this.password); 
    const updatedOrder = {
      name: this.name,
      unit: this.suite,
      streetNumber: this.streetNumber,
      streetName: this.street,
      city: this.city,
      province: this.province,
      zip: this.postcode,
      country: this.country
    };

    const updatedOrderForIdDock = {
      merchantId: this.order.merchantId,
      items: this.order.items,
      currency: this.order.currency,
      transAmount: this.order.transAmount,
      ...updatedOrder
    };    

    (await this.iddockServ.updateIdDock(seed, this.order.objectId, 'things', null, updatedOrderForIdDock, null)).subscribe(res => {
      if(res) {
        if(res.ok) {
          this.orderServ.update(this.orderID, updatedOrder).subscribe(
            (res: any) => {
              if (res && res.ok) {
                this.addAddress();
              }
            }
          );
        } else {

        }
        
      }
    });



  }

  confirm() {
    this.updateOrderAddress();
  }
  addAddress() {

    const address = {
      name: this.name,
      suite: this.suite,
      streetNumber: this.streetNumber,
      street: this.street,
      district: this.district,
      city: this.city,
      province: this.province,
      postcode: this.postcode,
      country: this.country
    };


    if (this.id) {
      this.addressServ.updateAddress(this.id, address).subscribe(
        (res: any) => {
          console.log('res for updateAddress', address);
          if (res && res.ok) {
            this.router.navigate(['/payment/' + this.orderID]);
          }
        }
      );
    } else {
      this.addressServ.addAddress(address).subscribe(
        (res: any) => {
          if (res && res.ok) {
            const _body = res._body;
            const addressId = _body._id;
            const body = {
              homeAddressId: addressId
            }
            this.userServ.updateSelf(body).subscribe(
              (res: any) => {
                console.log('res for updateSelf=', res);
                if (res && res.ok) {
                  this.router.navigate(['/payment/' + this.orderID]);
                }
              }
            );
          }
          console.log('res for addAddress', address);
        }
      );
    }
  }
}