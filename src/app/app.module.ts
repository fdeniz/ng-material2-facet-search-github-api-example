import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { NgMaterial2FacetSearchModule } from 'ng-material2-facet-search';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import {
	MatCardModule,
	MatCheckboxModule,
	MatDividerModule,
	MatExpansionModule,
	MatSortModule,
	MatTableModule,
	MatProgressSpinnerModule,
	MatPaginatorModule
} from '@angular/material';



@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		FormsModule,
		HttpClientModule,
		BrowserModule,
		FlexLayoutModule,
		BrowserAnimationsModule,
		MatCardModule,
		MatDividerModule,
		MatProgressSpinnerModule,
		MatCheckboxModule,
		MatSortModule,
		MatTableModule,
		MatPaginatorModule,
		MatExpansionModule,
		NgMaterial2FacetSearchModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
