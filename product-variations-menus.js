/**
 * productVariationsMenus [c]2016, @n_cholas, OmCore Ltd. MIT/GPL
 *
 * http://github.com/nicholaswright/product-variations-menus
 */
;(function($) {
    'use strict';
    $.fn.productVariationsMenus = function(options) {
        return this.each(function() {
            
            var defaults = {
                    onVariationData: function() {
                        return true; // Must return true to execute the default functionality
                    },
                    variationIdSelector: '[data-variation-id]',
                    priceSelector: '.price-price',
                    comparisonSelector: '.price-comparison',
                    savingSelector: '.price-saving',
                    discountSelector: '.price-discount',
                    priceLabelSelector: '.price-label',
                },
                settings = $.extend({}, defaults, options),
                container = $(this),
                productId = container.attr('data-product-id'),
                
                // Set elements
        	    menus = container.find('[data-variations-menu]'),
        	    button = container.find('[data-variations-menus-button]'),
        	    variationIdField = container.find(settings.variationIdSelector),
        	    
                selectedVariableIds = JSON.parse(container.attr('data-selected-variable-ids')),
                variableIds;
                
            if (!selectedVariableIds) {
                selectedVariableIds = {};
            }
            
            menus.each(function(key, el) {
                $(el)
                    .on('change', function(e) {
                        var el = $(this),
                            optionId = el.attr('data-variations-menu'),
                            nextMenu = $(menus.get(key+1)),
                            variableId = parseInt(el.val());
                    	
                    	// Whenever a menu is used reset all menus below it.
                    	var a = menus.slice(key+1);
                    	$.each(a, function(key, menu) {
                            menu.length = 1;
                            $(menu).attr('disabled', true);
                        });
                    	
                    	// Create a copy of the provided variable IDs object 
                    	// and add the selected menu's variables to it.
                        // This is provided in the AJAX request so the next menu's
                        // options are filtered correctly, and once all menus are
                        // selected it is used to determine the selected variation.  
                    	variableIds = JSON.parse(JSON.stringify(selectedVariableIds)); // Create a copy
                    	var a = menus.slice(0, key+1);
                    	$.each(a, function(key, menu) {
                            var optionId = $(menu).attr('data-variations-menu'),
                            	variableId = parseInt($(menu).val());
                            variableIds[optionId] = variableId;
                        });
                        
                    	// If the user selects all menus but then moves backwards
                    	// in the process, we must disable the button again.
                        button.attr('disabled', true);
                    	
                        $('body').css('cursor', 'wait');
                    
                        if (nextMenu.length) {
                            var nextOptionId = $(nextMenu).attr('data-variations-menu');
                                                            
                            $.get('/admin/controller/ProductVariations/getVariationsMenuData', {
                            	productId: productId,
                                optionId: nextOptionId,
                                variableIds: variableIds
                            }, function(data) {
                                //console.log(data);
                                var obj = JSON.parse(data);
                                if (
                                    obj
                                    && obj.variables
                                ) {
                                    $.each(obj.variables, function(id, title) {
                                        $('<option />', {
                                        	value: id
                                        })
                                            .html(title)
                                        	.appendTo(nextMenu);
                                    });
                                    
                            		$(nextMenu).removeAttr('disabled');
                                }
                                
                                $('body').css('cursor', 'inherit');
                            });
                        } else {
                            $.get('/admin/controller/ProductVariations/getVariationData', {
                            	productId: productId,
                                variableIds: variableIds
                            }, function(data) {
                                
                                var variation = JSON.parse(data);
                                if (
                                    variation
                                    && settings.onVariationData.call(variation)
                                ) {
                                    var formatPrice = function(price) {
                                    	return price.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
                                    }
                                    
                                    if (
                                        variation.id 
                                        && variationIdField
                                    ) {
                                        variationIdField.val(variation.id);
                                    }
                                    
                                    var priceSpan = container.find(settings.priceSelector);
                                    if (variation.price) {
                                        priceSpan.html(formatPrice(variation.price));
                                    }
                                    
                                    var comparisonPrice = container.find(settings.comparisonSelector);
                                    if (variation.comparisonPrice) {
                                        comparisonPrice.show();
                                        comparisonPrice.find('span').html(formatPrice(variation.comparisonPrice));
                                    }
                                    
                                    if (variation.was) {
                                        container.find(settings.comparisonSelector)
                                            .show()
                                        	.find('span')
                                            	.html(formatPrice(variation.was));

                                        container.find(settings.savingSelector)
                                            .show()
                                        	.find('span')
                                            	.html(formatPrice(variation.saving));

                                        container.find('p.price').addClass('sale');
                                    }
                                    
                                    if (
                                        variation.discountPercentage
                                        && variation.discountPercentage != '0'
                                    ) {
                                        container.find(settings.discountSelector)
                                            .show()
                                            .find('span')
                                            	.html(variation.discountPercentage);
                                    }

                                    // Clear the price label, which normally contains 'from'
                                    container.find(settings.priceLabelSelector).hide();
                                }
                                
                         		button.removeAttr('disabled');
                                
                                $('body').css('cursor', 'inherit');
                            });
                        }
                    });            
            });
            
        });
    };
})(jQuery);