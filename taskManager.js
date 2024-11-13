import { LightningElement, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getUserTasks from '@salesforce/apex/TaskController.getUserTasks';
import createTask from '@salesforce/apex/TaskController.createTask';
import updateTaskStatus from '@salesforce/apex/TaskController.updateTaskStatus';

export default class TaskManager extends LightningElement {
    @track tasks = [];
    @track draftValues = [];

    // Form fields
    taskName = '';
    description = '';
    dueDate = '';
    priority = '';
    priorityFilter = ''; // For priority filter
    statusFilter = ''; // For status filter

    priorityOptions = [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
    ];
    statusOptions = [
        { label: 'New', value: 'New' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' }
    ];

    // Table columns
    columns = [
    { label: 'Task Name', fieldName: 'Name' },
    { label: 'Description', fieldName: 'Description__c' },
    { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' },
    { label: 'Priority', fieldName: 'Priority__c' },
    {
        label: 'Status',
        fieldName: 'Status__c',
        type: 'picklist',  // Custom type to show options
        editable: true,
        typeAttributes: {
            placeholder: 'Choose status', // Default text when nothing is selected
            options: [
                { label: 'New', value: 'New' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Completed', value: 'Completed' }
            ],
            value: { fieldName: 'Status__c' }, // Maps to Status__c field in data
            context: { fieldName: 'Id' }       // Used to identify the row in handleSave
        }
    }
];

// Handle filter change
    handleFilterChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;
    }

    // Fetch tasks on component load
    @wire(getUserTasks, { priorityFilter: '$priorityFilter', statusFilter: '$statusFilter' })
    wiredTasks({ error, data }) {
        if (data) {
            this.tasks = data;
        } else if (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    

    // Handle input change
    handleInputChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;
    }

    // Create a new task
    createTask() {
        if (!this.dueDate || new Date(this.dueDate) < new Date()) {
            alert('Due Date cannot be in the past.');
            return;
        }

        const newTask = {
            Name: this.taskName,
            Description__c: this.description,
            Due_Date__c: this.dueDate,
            Priority__c: this.priority,
            Status__c: 'New'
        };

        createTask({ newTask })
            .then(() => {
                return getUserTasks(); // Refresh task list
            })
            .then((result) => {
                this.tasks = result;
                this.clearFormFields();
            })
            .catch((error) => {
                console.error('Error creating task:', error);
            });
    }

    // Clear form fields after task creation
    clearFormFields() {
        this.taskName = '';
        this.description = '';
        this.dueDate = '';
        this.priority = '';
    }

    // Handle inline editing for task status
    handleSave(event) {
    const updatedFields = event.detail.draftValues[0];
    updateTaskStatus({ taskId: updatedFields.Id, status: updatedFields.Status__c })
        .then(() => {
            return getUserTasks(); // Refresh task list
        })
        .then((result) => {
            this.tasks = result;
            this.draftValues = [];  // Clear draft values after successful save
        })
        .catch((error) => {
            console.error('Error updating task status:', error);
        });
}

}