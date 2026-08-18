/**
 * issue-list.component.ts: Displays incident reports, photo previews, severity triage filters, and real-time status transitions.
 * Called by: Route '/issues' (Admin and Fleet Manager).
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IssueService, Issue } from '../../../core/services/issue.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './issue-list.component.html',
  styleUrl: './issue-list.component.scss'
})
export class IssueListComponent implements OnInit, OnDestroy {
  issues: Issue[] = [];
  searchQuery = '';
  severityFilter = '';
  statusFilter = '';
  loading = true;
  errorMessage = '';
  noticeMessage = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private issueService: IssueService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadIssues();

    // Real-time socket listener: refresh list when severe damage report arrives
    this.subscriptions.push(
      this.socketService.severeIssue$.subscribe(() => {
        this.loadIssues();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadIssues(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.issueService.getAll().subscribe({
      next: (data) => {
        this.issues = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load damage reports. Please check network and retry.';
        this.cdr.detectChanges();
      },
    });
  }

  get filteredIssues(): Issue[] {
    return this.issues.filter((i) => {
      const matchSearch =
        !this.searchQuery ||
        i.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.registration_number?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.reporter_name?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchSeverity = !this.severityFilter || i.severity === this.severityFilter;
      const matchStatus = !this.statusFilter || i.status === this.statusFilter;

      return matchSearch && matchSeverity && matchStatus;
    });
  }

  onStatusChange(issue: Issue, newStatus: string): void {
    this.issueService.update(issue.id, { status: newStatus as any }).subscribe({
      next: (updated) => {
        issue.status = updated.status;
        this.noticeMessage = `Issue "${issue.title}" status updated to ${newStatus.replace('_', ' ')}.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update status.');
        this.cdr.detectChanges();
      },
    });
  }
}
