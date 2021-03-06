import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TitleFacadeService } from '@etdb/core/+state/facades';
import { AuthenticationLog, User } from '@etdb/models';
import { AuthenticationLogFacadeService, UsersFacadeService } from '@etdb/users/+state/facades';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

@Component({
    selector: 'etdb-user',
    templateUrl: 'user-profile.component.html',
    styleUrls: ['user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {

    public selectedUserIsAuthenticatedUser$: Observable<boolean>;
    public loading$: Observable<boolean>;
    public user$: Observable<User>;
    public loadingAuthenticationLogs$: Observable<boolean>;
    public authenticationLogs$: Observable<AuthenticationLog[]>;
    public loadingUser$: Observable<boolean>;
    public currentUser$: BehaviorSubject<User> = new BehaviorSubject(null);
    public selectedAuthenticationView = 'table_chart';

    public constructor(
        private route: ActivatedRoute,
        private titleFacadeService: TitleFacadeService,
        private userFacadeService: UsersFacadeService,
        private authenticationFacadeService: AuthenticationLogFacadeService,
    ) { }

    public ngOnInit(): void {
        this.loadingUser$ = this.userFacadeService.fetching$;
        this.loadingAuthenticationLogs$ = this.authenticationFacadeService.loadingAuthenticationLogs$;
        this.authenticationLogs$ = this.authenticationFacadeService.authenticationLogs$;

        this.loading$ = combineLatest(this.loadingUser$, this.loadingAuthenticationLogs$)
            .pipe(map(([loadingUser, loadingAuthenticationLogs]) => loadingUser || loadingAuthenticationLogs));

        this.user$ = this.route.data.pipe(
            map((userData: { user: User }) => {
                if (!userData.user) {
                    return;
                }

                this.currentUser$.next(userData.user);

                this.titleFacadeService.setTitle(`User | ${userData.user.userName}`);
                return userData.user;
            })
        );

        this.selectedUserIsAuthenticatedUser$ = this.userFacadeService.selectedUserIsAuthenticatedUser$;
    }

    public tabChanged(tabChangedEvent: MatTabChangeEvent) {
        if (tabChangedEvent.tab.textLabel !== 'Sign-In Logs') {
            return;
        }

        const currentUser = this.currentUser$.getValue();

        if (!currentUser) {
            return;
        }

        this.authenticationFacadeService.loadLogs(currentUser.authenticationLogsUrl);
    }

    public toggleView(change: MatButtonToggleChange): void {
        this.selectedAuthenticationView = change.value;
    }
}
