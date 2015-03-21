// This code only runs on the client
Template.TodoList.helpers({
  tasks: function () {
    if (Session.get("hideCompleted")) {
      // If hide completed is checked, filter tasks
      return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
    } else {
      // Otherwise, return all of the tasks
      return Tasks.find({}, {sort: {createdAt: -1}});
    }
  },
  hideCompleted: function () {
    return Session.get("hideCompleted");
  },
  incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
  }
});

Template.TodoList.events({
  "submit .new-task": function (event) {
    // This function is called when the new task form is submitted

    var text = event.target.text.value;

    Tasks.insert({
      text: text,
      createdAt: new Date() // current time
    });

    // Clear form
    event.target.text.value = "";

    // Prevent default form submit
    return false;
  },
  "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
  }
});
Template.task.events({
  "click .toggle-checked": function () {
    // Set the checked property to the opposite of its current value
    Tasks.update(this._id, {$set: {checked: !this.checked}});
  },
  "click .delete": function () {
    Tasks.remove(this._id);
  }
});

Router.route('/todos', function () {
  // render the Home template with a custom data context
  this.render('TodoList');
});
