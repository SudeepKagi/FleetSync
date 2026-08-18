/**
 * audit-log.component.ts: Displays paginated immutable audit log events for system actions.
 * Called by: Route '/audit-log' (Super Admin only).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLogItem } from '../../core/services/audit.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss'
})
export class AuditLogComponent implements OnInit {
  logs: AuditLogItem[] = [];
  totalLogs = 0;
  selectedEntityType = 'all';
  loading = true;

  constructor(
    private auditService: AuditService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.auditService.getAuditLogs(this.selectedEntityType, 50, 0).subscribe({
      next: (res) => {
        this.logs = res.logs;
        this.totalLogs = res.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading audit log:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
