import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { merge, Observable, of as observableOf, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { Facet, FacetFilterType, FacetDataType } from 'ng-material2-facet-search';
import { NgMaterial2FacetSearchComponent } from 'ng-material2-facet-search';

export interface GithubApi {
	repo: string;
	items: GithubIssue[];
	total_count: number;
}

export interface GithubIssue {
	html_url: string;
	created_at: string;
	updated_at: string;
	number: string;
	state: string;
	title: string;
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent  {
  
	// Facet definitions
	facets = [
		{
			name: 'repo',
			text: 'Repo',
			type: FacetDataType.Text,
			icon: '',
			readonly: true,
			values: [{ value: 'angular/material2', type: FacetFilterType.equal }]
		}, {
			name: 'created_at',
			text: 'Created',
			type: FacetDataType.Date,
			icon: 'date_range'
		}, {
			name: 'updated_at',
			text: 'Updated',
			type: FacetDataType.Date,
			icon: 'date_range'
		}, {
			name: 'state',
			text: 'State',
			type: FacetDataType.CategorySingle,
			icon: 'folder_open',
			options: of([
				{ value: 'open', text: 'Open' },
				{ value: 'closed', text: 'Closed' }
			])
		}, {
			name: 'keyword',
			text: 'Keyword',
			description: 'Github API will search this keyword in all issue title, issue body, and issue comment body.',
			type: FacetDataType.Text,
			icon: 'description',
			fixedFilterType: FacetFilterType.contains
		}

	];
	// Settings
	confirmOnRemove = false;
	chipLabelsEnabled = true;
	clearButtonEnabled = true;

	displayedColumns: string[] = ['created_at', 'updated_at', 'state', 'number', 'title'];
	exampleDatabase: ExampleHttpDatabase | null;
	data: GithubIssue[] = [];

	resultsLength = 0;
	isLoadingResults = true;
	isRateLimitReached = false;


	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(NgMaterial2FacetSearchComponent) facetSearchComponent: NgMaterial2FacetSearchComponent;

	constructor(private http: HttpClient) { }

	ngOnInit(): void {

	}

	ngAfterViewInit() {

		this.exampleDatabase = new ExampleHttpDatabase(this.http);

		// If the user changes the sort order, reset back to the first page.
		this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

		merge(this.sort.sortChange, this.paginator.page, this.facetSearchComponent.searchUpdated)
			.pipe(
				startWith({}),
				switchMap(() => {

					this.isLoadingResults = true;

					const repo = this.getFacetsFirstValue('repo');
					const createdAt = this.getFacetsFirstValue('created_at');
					const updatedAt = this.getFacetsFirstValue('updated_at');
					const htmlUrl = this.getFacetsFirstValue('html_url');
					const state = this.getFacetsFirstValue('state');
					const title = this.getFacetsFirstValue('title');
					const number = this.getFacetsFirstValue('number');

					const keyword = this.getFacetsFirstValue('keyword') || '';

					const filter = {
						created_at: createdAt,
						updated_at: updatedAt,
						html_url: htmlUrl,
						state: state,
						title: title,
						number: number
					};

					return this.exampleDatabase!.getRepoIssues(repo, filter, keyword, this.sort.active, this.sort.direction, this.paginator.pageIndex);
				}),
				map(data => {
					// Flip flag to show that loading has finished.
					this.isLoadingResults = false;
					this.isRateLimitReached = false;
					this.resultsLength = data.total_count;

					return data.items;
				}),
				catchError(() => {
					this.isLoadingResults = false;
					// Catch if the GitHub API has reached its rate limit. Return empty data.
					this.isRateLimitReached = true;
					return observableOf([]);
				})
			).subscribe(data => this.data = data);
	}


	getFacetsFirstValue = (name: string) => {
		try {
			const value = _.find(this.facetSearchComponent.selectedFacets, { name: name })!.values![0]!.value;

			if (value instanceof Date) {
				return value.toISOString().split('T')[0];
			}

			return value.toString();

		} catch (e) {
			return null;
		}
	}
}


/** An example database that the data source uses to retrieve data for the table. */
export class ExampleHttpDatabase {
	constructor(private http: HttpClient) { }


	getRepoIssues(repoName: string, filter: object, keyword: string, sort: string, order: string, page: number): Observable<GithubApi> {

		// https://developer.github.com/v3/search/
		const href = 'https://api.github.com/search/issues';

		// https://developer.github.com/v3/search/#constructing-a-search-query
		const searchQuery = Object
			.entries(_.pickBy(filter, _.identity))
			.map(([key, val]) => `${key.replace('_at', '')}:${val}`) // fix: github uses differrent column names for displaying and querying?
			.join('+');

		const requestUrl =
			`${href}?q=${keyword}+repo:${repoName}+${searchQuery}&sort=${sort}&order=${order}&page=${page + 1}`;

		console.log('requestUrl:', requestUrl);

		return this.http.get<GithubApi>(requestUrl);
	}
}
