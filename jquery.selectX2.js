/*
    jquery.selectX2 plugin (http://github.com/BarsukovDmitry/selectX2)

    Usage example: 
    
    $('#listbox').selectX2({
        showSearch: true,
        openOptions: false
    });
*/

(function ($) {
    var options = {
        showSearch: true,
        openOptions: false
    };

    $.fn.extend({
        selectX2: function(optionsArg) {

            //override options
            $.extend(options, optionsArg);

            //constants
            var showOptionsText = 'Показать варианты ↓';
            var hideOptionsText = 'Скрыть варианты ↑';
            var addOptionsText = 'Выбрать';
            var removeOptionsText = 'Убрать';
            var searchPlaceholder = 'Поиск';
            var errorMessage = 'selectX2: Произошла ошибка';

            //controls
            this.$container;
            this.$hiddenListbox = this;
            this.$selectedListbox;
            this.$removeButton;
            this.$buttonsContainer1;
            this.$buttonsContainer2;
            this.$showHideButton;
            this.$addButton;
            this.$removeButton;
            this.$optionsListbox;
            this.$searchInput;
            this.$searchClearSpan;

            //vars
            this.isOptionsButtonsVisible = false;

            //create controls
            this.$container = $('<div/>').addClass('selectX2Container');

            this.$selectedListbox = $('<select multiple/>').addClass('selectX2Select1');
            this.$container.append(this.$selectedListbox);

            this.$buttonsContainer1 = $('<div/>').addClass('selectX2ButtonsContainer1');
            this.$removeButton = $('<button type="button"/>').text(removeOptionsText).prop('disabled', true);
            this.$buttonsContainer1.append(this.$removeButton);
            this.$showHideButton = $('<button type="button"/>').text(showOptionsText);
            this.$buttonsContainer1.append(this.$showHideButton);
            this.$container.append(this.$buttonsContainer1);

            this.$buttonsContainer2 = $('<div/>').addClass('selectX2ButtonsContainer2').css('display', 'none');
            this.$addButton = $('<button type="button"/>').text(addOptionsText).prop('disabled', true);
            this.$buttonsContainer2.append(this.$addButton);
            this.$container.append(this.$buttonsContainer2);

            this.$optionsListbox = $('<select multiple/>').addClass('selectX2Select2').hide();
            this.$container.append(this.$optionsListbox).addClass('selectX2OptionsSelect');


            //FUNCTIONS

            function addOptionAtPosition(toSelect, newOption, index) {
                if (! toSelect) {
                    throw 'toSelect is required';
                }
                if (!newOption) {
                    throw 'newOption is required';
                }
                if (typeof (index) === 'undefined') {
                    throw 'index is required';
                }

                try {
                    toSelect.add(newOption, toSelect.options[index]);
                }
                //IE
                catch (ex) {
                    toSelect.add(newOption, index);
                }
            }

            function moveOptionByIndex(fromSelect, toSelect, optionIndex, select) {
                var option = fromSelect.options[optionIndex];
                var text = option.firstChild.nodeValue;
                var value = option.value;
                var newOption = new Option(text, value, false, select);
                newOption.title = text;

                //determine the position for insert
                var i;
                for (i = 0; i < toSelect.options.length; ++i) {
                    if (text < toSelect.options[i].text)
                        break;
                }

                //insert new option
                toSelect.focus();
                if (toSelect.options.length == i) {
                    toSelect.add(newOption);
                } else {
                    addOptionAtPosition(toSelect, newOption, i);
                }

                fromSelect.remove(optionIndex);
            }

            function checkIfContains(select, value, text) {
                var result = false;

                $(select).find('option').each(function(objIndex, objValue) {
                    if ($(objValue).val() == value && $(objValue).text() == text) {
                        result = true;
                        return false;
                    }
                });

                return result;
            }

            this.moveSelectedOptions = $.proxy(function(action) {
                var fromSelect;
                var toSelect;

                if (action == 'add') {
                    fromSelect = this.$optionsListbox[0];
                    toSelect = this.$selectedListbox[0];
                } else if (action == 'remove') {
                    fromSelect = this.$selectedListbox[0];
                    toSelect = this.$optionsListbox[0];
                } else {
                    throw 'Wrong action value';
                }

                //clear selection first
                $(toSelect).find('option').prop('selected', false);

                //moving
                for (var i = 0; i < fromSelect.options.length; ++i) {
                    if (fromSelect.options[i].selected) {
                        var value = fromSelect.options[i].value;
                        var text = $(fromSelect.options[i]).text();

                        moveOptionByIndex(fromSelect, toSelect, i, true);

                        this.$hiddenListbox.find('option[value=' + value + ']').prop('selected', action == 'add');

                        if (!checkIfContains(toSelect, value, text)) {
                            alert(errorMessage);
                            throw 'Failed to move option';
                        }

                        if (checkIfContains(fromSelect, value, text)) {
                            alert(errorMessage);
                            throw 'Failed to move option';
                        }

                        --i;
                    }
                }

                this.checkIfSynchronized();


            }, this);

            this.populate = $.proxy(function(includingSelected) {
                //clear all options first
                this.$optionsListbox.html('');

                var searchString = this.$searchInput.val();
                var hiddenListbox = this.$hiddenListbox[0];
                var selectedOptionsListbox = this.$selectedListbox[0];
                var optionsListbox = this.$optionsListbox[0];

                for (var i = 0; i < hiddenListbox.options.length; ++i) {
                    var option = hiddenListbox.options[i];
                    var text = option.firstChild.nodeValue;
                    var value = option.value;
                    
                    var newOption = new Option(text, value, false, false);

                    if (option.selected) {
                        if (includingSelected) {
                            selectedOptionsListbox.add(newOption);
                            if (!checkIfContains(selectedOptionsListbox, value, text)) {
                                alert(errorMessage);
                                throw 'Failed to add option';
                            }
                        }
                    } else {
                        if (!searchString || text.toLowerCase().indexOf(searchString.toLowerCase()) >= 0) {
                            optionsListbox.add(newOption);
                            if (!checkIfContains(optionsListbox, value, text)) {
                                alert(errorMessage);
                                throw 'Failed to add option';
                            }
                        }
                    }
                }
            }, this);

            this.updateSearchClearSpanVisibility = $.proxy(function() {
                if (this.$searchInput.val()) {
                    this.$searchClearSpan.show();
                } else {
                    this.$searchClearSpan.hide();
                }
            }, this);

            this.updateButtonsState = $.proxy(function() {
                this.$addButton.prop('disabled', this.$optionsListbox.find('option:selected').length == 0);
                this.$removeButton.prop('disabled', this.$selectedListbox.find('option:selected').length == 0);
            });

            this.checkIfSynchronized = $.proxy(function() {
                this.$hiddenListbox.find('option').each($.proxy(function (objIndex, objValue) {
                    var value = objValue.value;
                    var text = $(objValue).text();

                    if (objValue.selected) {
                        if (! checkIfContains(this.$selectedListbox[0], value, text)) {
                            alert(errorMessage);
                            throw 'hiddenListbox is not synchronized';
                        }
                    } 
                }, this));
            }, this);


            //OPTIONS

            if (options) {
                if (options.showSearch) {
                    this.$searchInput = $('<input type="text"/>');
                    this.$buttonsContainer2.append(this.$searchInput);

                    //add clear icon
                    this.$searchInput
                        .prop('placeholder', searchPlaceholder)
                        .wrap('<span class="selectX2DeleteIcon" />');

                    this.$searchClearSpan = $('<span/>').text('×').hide();
                    this.$searchInput.after(this.$searchClearSpan);

                }
                if (options.openOptions) {
                    this.$showHideButton.click();
                }
                
            }


            //EVENTS

            this.$showHideButton.click($.proxy(function () {
                if (this.isOptionsButtonsVisible) {
                    this.$buttonsContainer2.hide();
                    this.$optionsListbox.hide();
                    this.isOptionsButtonsVisible = false;
                    this.$showHideButton.text(showOptionsText);
                } else {
                    this.$buttonsContainer2.show();
                    this.$optionsListbox.show();
                    this.isOptionsButtonsVisible = true;
                    this.$showHideButton.text(hideOptionsText);
                }
            }, this));

            this.$selectedListbox.change($.proxy(function() {
                this.$optionsListbox.find('option').prop('selected', false);
                this.updateButtonsState();
            }, this));

            this.$optionsListbox.change($.proxy(function () {
                this.$selectedListbox.find('option').prop('selected', false);
                this.updateButtonsState();
            }, this));

            this.$addButton.click($.proxy(function() {
                this.moveSelectedOptions('add');
                this.updateButtonsState();
            }, this));

            this.$removeButton.click($.proxy(function () {
                this.moveSelectedOptions('remove');
                this.updateButtonsState();
            }, this));

            this.$optionsListbox.dblclick($.proxy(function () {
                this.$addButton.trigger('click');
            }, this));

            this.$selectedListbox.dblclick($.proxy(function () {
                this.$removeButton.trigger('click');
            }, this));

            if (this.$searchInput) {
                this.$searchInput.on('keyup', $.proxy(function () {
                    this.updateSearchClearSpanVisibility();
                    this.populate();
                    this.updateButtonsState();
                }, this));

                this.$searchClearSpan.click($.proxy(function () {
                    this.$searchInput.val('').focus();
                    this.updateSearchClearSpanVisibility();
                    this.populate();
                    this.updateButtonsState();
                }, this));
            }


            //INIT

            this.populate(true);

            //show controls
            this.$hiddenListbox.css('display', 'none');
            this.$container.insertAfter(this.$hiddenListbox);
        }
    });
})(jQuery);