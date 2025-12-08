import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.scss',
})

export class ManageUsersComponent {
  constructor(private router: Router) {}
}
