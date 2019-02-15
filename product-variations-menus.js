/**
 * productVariationsMenus [c]2019, @n_cholas, OmCore Ltd. MIT/GPL
 *
 * http://github.com/creativecms/product-variations-menus
 */
;(function($) {
    'use strict';
    $.fn.productVariationsMenus = function(options) {
        return this.each(function() {
            
            var defaults = {
                onVariationData: function() {
                    return true; // Must return true to execute the default functionality
                },
            };
            
            var settings = $.extend({}, defaults, options);
            
            var container = $(this);
            
            // Data attributes
            var productId = container.attr('data-product-id');
            var discountPercentage = parseFloat(container.attr('data-discount-percentage'));
            
            // Set elements
            var menus = container.find('[data-variations-menu]');
            var button = container.find('[data-variations-menus-button]');
            
            var priceEl;
            var priceLabelEl;
            var comparisonPriceEl;
            var savingAmountEl;
            var discountPercentageEl;
            setElements();
            
            // If the product has only a single variation then there will be no menus presented.
            // In this case run the request immediately to set the price and variation ID.
            if (menus.length == 0) {
                requestData();
            } else {
                menus.each(function(key, el) {
                    $(el)
                        .on('change', function(e) {
                            var el = $(this);
                            var optionId = el.attr('data-variations-menu');
                            var nextMenu = $( menus.get( key + 1 ) );
                            var variableId = parseInt(el.val());
                            
                            resetSubsequentMenus(key);
                            
                            // If the user selects all menus but then moves backwards
                            // in the process, we must disable the button again.
                            button.attr('disabled', true);
                            
                            $('body').css('cursor', 'wait');
                            
                            if (nextMenu.length) {
                                var nextOptionId = $(nextMenu).attr('data-variations-menu');
                                
                                $.ajax({
                                    url: '/controller/ProductVariations/getVariationsMenuData',
                                    data: {
                                        productId: productId,
                                        optionId: nextOptionId,
                                        variableIds: getVariableIds(key),
                                        raw: true
                                    },
                                    success: function(obj) {
                                        if (obj) {
                                            // Replace the next menu's options with the returned variables.
                                            if (obj.variables) {
                                                $.each(obj.variables, function(key, variable) {
                                                    $('<option />', {
                                                        value: variable.id
                                                    })
                                                        .html(variable.title)
                                                        .appendTo(nextMenu);
                                                });
                                                
                                                $(nextMenu).removeAttr('disabled');
                                            }
                                            
                                            // The variation with the lowest price is returned.
                                            // Use this to update the prices and show the current lowest prices based on the
                                            // user's current selection.
                                            if (obj.variation) {
                                                onVariationData(obj.variation);
                                                priceLabelEl.show();
                                            }
                                        }
                                        
                                        $('body').css('cursor', 'inherit');
                                    },
                                    cache: false
                                });
                            } else {
                                requestData();
                            }
                        });
                });
            }
            
            function setElements() {
                priceEl = container.find('.price-price');
                priceLabelEl = container.find('.price-label');
                comparisonPriceEl = container.find('.price-comparison');
                savingAmountEl = container.find('.price-saving');
                discountPercentageEl = container.find('.price-discount');
            }
            
            function getVariableIds(key) {
                var variableIds = {};
                var a = key >= 0 ? menus.slice(0, key + 1) : menus;
                $.each(a, function(key, menu) {
                    var optionId = $(menu).attr('data-variations-menu'),
                        variableId = parseInt($(menu).val());
                    variableIds[optionId] = variableId;
                });
                return variableIds;
            }
            
            function resetSubsequentMenus(key) {
                var a = menus.slice( key + 1 );
                $.each(a, function(key, menu) {
                    menu.length = 1;
                    $(menu).attr('disabled', true);
                });
            }
            
            function requestData() {
                $.ajax({
                    url: '/controller/ProductVariations/getVariationData',
                    data: {
                        productId: productId,
                        variableIds: getVariableIds(),
                        raw: true
                    },
                    //headers: headers,
                    success: function(variation) {
                        if (variation) {
                            // todo - Add if condition and if returns false don't use default script below.
                            //settings.onVariationData(container, variation);
                            onVariationData(variation);
                        }
                        
                        button.removeAttr('disabled');
                        $('body').css('cursor', 'inherit');
                    },
                    cache: false
                });
            }
            
            function onVariationData(variation) {
                
                var comparisonPrice = parseFloat(variation.comparisonPrice);
                var price = parseFloat(variation.price);
                
                var comparisonPrice = comparisonPrice ? comparisonPrice : price;
                
                //
                if (discountPercentage) {
                    price = price - (price / 100 * discountPercentage);
                }
                
                // Will result in zero if no reduction exists.
                var savingAmount = comparisonPrice - price;
                
                if (savingAmount) {
                    discountPercentage = savingAmount / comparisonPrice * 100;
                    discountPercentage = new Intl.NumberFormat('en-EN', {
                        maximumFractionDigits: 0
                    }).format(discountPercentage);
                }
                console.log({
                    comparisonPrice: comparisonPrice,
                    price: price,
                    savingAmount: savingAmount,
                    discountPercentage: discountPercentage
                });
                
                setHiddenFields(variation);
                
                priceEl.html(formatPrice(price));
                
                if (savingAmount) {
                    comparisonPriceEl.show()
                        .find('span').html(formatPrice(comparisonPrice));
                    savingAmountEl.show()
                        .find('span').html(formatPrice(savingAmount));
                } else {
                    comparisonPriceEl.hide();
                    savingAmountEl.hide();
                }
                
                if (
                    discountPercentage
                    && discountPercentage > 0
                ) {
                    discountPercentageEl.show()
                        .find('span').html(variation.discountPercentage);
                } else {
                    discountPercentageEl.hide();
                }
                
                // Clear the price label, which normally contains 'from'
                priceLabelEl.hide();
            }
            
            function setHiddenFields(variation) {
                container.find('[name="variation_id"]').val(variation.id);
                container.find('[name="gross"]').val(variation.price);
                container.find('[name="sku"]').val(variation.sku);
            }
            
            function formatPrice(num) {
                return new Intl.NumberFormat('en-EN', {
                    style: 'currency',
                    currency: 'GBP',
                    maximumFractionDigits: 2
                }).format(num);
            }
            
        });
    };
})(jQuery);