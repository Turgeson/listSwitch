// ie back compatibility
if(!Array.prototype.indexOf){Array.prototype.indexOf=function(elt){var len=this.length>>>0;var from=Number(arguments[1])||0;from=(from<0)?Math.ceil(from):Math.floor(from);if(from<0)from+=len;for(;from<len;from++){if(from in this&&this[from]===elt)return from}return-1}}

(function($){
	$.fn.listSwitch = function(method){
		var target = $(this);
		var methods = {
			bindData: function(opts){_bindData(opts);},
			clear: function(){_clearBoxes();},
			getItemList: function(rs){return _getItemList(rs);},
			getHistory: function(rs,key){return _getHistory(rs,key);},
            setHistoryKey: function(key){return _setLastHistoryKey(key);}
		};
		
		var settings = {
			url:null,
			urlArgs: null,
			data: null,
			leftData: 'left',
			rightData: 'right',
			valueField: 'id',
			textField: 'name',
			captions: {left:null, right:null},
			width: 225,
			height: 300,
            historyKey:'',
            buttonClick: [null,null,null,null]
		};
		
		if(methods[method]){
			target = this;
            return methods[method].apply( this, Array.prototype.slice.call(arguments,1));
    	}else if (typeof method === 'object' || ! method ) {
      		if(method){
				$.extend(settings,method);
			}
			// get data
			if(settings.url){
				$.getJSON(settings.url,settings.urlArgs,function(res){settings.data = res;_init(target);},'json');
			}else{
				_init(target);
			} 
    	}else{
      		$.error('Method ' +  method + ' does not exist on jQuery.listSwitch' );
    	}    

		function _init(target){
			var plugin = 'ui-listswitch';
			var targetID = target.attr('id');
			var boxClasses = 'ui-corner-bl ui-corner-br';
			var clear = $('<div/>').css('clear','both');
			
            // buttons
			var buttonBox = $('<div />').addClass(plugin+'-buttonbox');
            var buttons = []
            buttons.push($('<span />').attr('id',targetID + '-addAll').addClass('ui-icon-seek-next'));
			buttons.push($('<span />').attr('id',targetID + '-addOne').addClass('ui-icon-triangle-1-e'));
			buttons.push($('<span />').attr('id',targetID + '-remOne').addClass('ui-icon-triangle-1-w'));
			buttons.push($('<span />').attr('id',targetID + '-remAll').addClass('ui-icon-seek-prev'));
            buttons[0].click(function(){_moveItem(lBox,rBox,false,true);});
            buttons[1].click(function(){_moveItem(lBox,rBox,true,true);});
			buttons[2].click(function(){_moveItem(rBox,lBox,true,false);});
			buttons[3].click(function(){_moveItem(rBox,lBox,false,false);});
            $(buttons).each(function(idx){
                if($.isArray(settings.buttonClick)){
                    buttons[idx].bind('click',settings.buttonClick[idx]);
                }else{
                    buttons[idx].bind('click', settings.buttonClick);
                }
                buttonBox.append($(this).addClass('ui-icon'));
            });
            $(buttonBox).children('span').wrap('<div class="ui-state-default ui-corner-all" />')
            $(buttonBox).children('div').hover(function(){$(this).addClass('ui-state-hover');},
							                    function(){$(this).removeClass('ui-state-hover');});

			// left side container
			var lSide = $('<div/>').css({width: settings.width + 'px',float: 'left'});
			// caption
			if(settings.captions.left){
				var caption = $('<div/>').html(settings.captions.left)
							.addClass(plugin+'-caption ui-widget-header ui-corner-tl ui-corner-tr');
				lSide.append(caption).append(clear);
			}
			// left box
			var lBox = $('<select />').attr({id:targetID+'_left',multiple:'multiple'})
						.css({width: settings.width,height: settings.height}).addClass('ui-widget-content ui-corner-all');
			if(settings.captions.left){
				lBox.css('border-top','0px').addClass(boxClasses).removeClass('ui-corner-all');
			}
            lBox.dblclick(function(){buttons[1].trigger('click')});
			
			// right side container
			var rSide = $('<div/>').css({width: settings.width + 'px',float: 'left'});
			// caption
			if(settings.captions.right){
				var caption = $('<div/>').html(settings.captions.right)
							.addClass(plugin+'-caption ui-widget-header ui-corner-tl ui-corner-tr');
				rSide.append(caption).append(clear)
			}
			// right box
			var rBox = $('<select />').attr({id:targetID+'_right',multiple:'multiple'})
									  .css({width: settings.width,height: settings.height})
									  .addClass('ui-widget-content ui-corner-all');
			if(settings.captions.right){
				rBox.css('border-top','0px').addClass(boxClasses).removeClass('ui-corner-all');
			}
            rBox.dblclick(function(){buttons[2].trigger('click')});
			
			lSide.append(lBox);
			target.append(lSide);
			target.append(buttonBox);
			rSide.append(rBox);
			target.append(rSide).addClass('ui-listswitch');
			if(settings.data){
                _bindData(settings);
            }
		};
		function _moveItem(from,to,one,add){
			var selector = '#'+from.attr('id');
			var itemSel = selector+' option'+(one?':selected':'');
			var actions = [];
			$(itemSel).each(function(idx,val){
				actions.push($(this).text());
			});
			$(itemSel).appendTo('#'+to.attr('id'));
			var $srtTo = $('#'+to.attr('id')+' option');
	        $srtTo.sort(function(a, b) {
            	if (a.text < b.text) return -1;
            	if (a.text == b.text) return 0;
            	return 1;
        	});
        	$($srtTo).remove();
        	$('#'+to.attr('id')).append($($srtTo)).val([]);
        	// log history
        	$.each(actions,function(idx,val){
        		_setHistory(actions[idx],add);
        	});
        };
		function _bindData(opts){
			var opt = {
				data: null,
				leftData: 'left',
				rightData: 'right',
				valueField: 'id',
				textField: 'name',
                titleField: 'title',
                historyKey: null
			};
			if(opts){$.extend(opt,opts);}
            
            var hxkey = '';
            if(opt.historyKey){
                _setLastHistoryKey(opt.historyKey);
                hxkey = opt.historyKey + ':';
            }
			
			var lBox = $('#'+$(target).attr('id')+'_left');
			lBox.empty();
            if(opt.data != null){
			    $.each(opt.data[opt.leftData], function(idx,val){
                    var o = $('<option />').val(opt.data[opt.leftData][idx][opt.valueField])
                        .html(opt.data[opt.leftData][idx][opt.textField]);
                    if(opt.data[opt.leftData][idx][opt.titleField]){
                        o.attr('title',opt.data[opt.leftData][idx][opt.titleField]);
                    }
				    $(lBox).append(o);
			    });
            }
			var rBox = $('#'+$(target).attr('id')+'_right');
			rBox.empty();
            if(opt.data != null){
			    $.each(opt.data[opt.rightData], function(idx,val){
                    var o = $('<option />').val(opt.data[opt.rightData][idx][opt.valueField])
                            .html(opt.data[opt.rightData][idx][opt.textField]);
                    if(opt.data[opt.rightData][idx][opt.titleField]){
                        o.attr('title',opt.data[opt.rightData][idx][opt.titleField]);
                    }
				    $(rBox).append(o);
			    });
            }
			var oL = $($(lBox).children()).map(function(){return this.text;}).get();
			var oR = $($(rBox).children()).map(function(){return this.text;}).get();
			jQuery.data(target,hxkey+'origL',oL);
			jQuery.data(target,hxkey+'origR',oR);
		};
		function _clearBoxes(){
			$('#'+$(target).attr('id') + ' select').empty();
		};
		function _getItemList(rightSide){
            return $('#'+$(target).attr('id') + '_' + (rightSide ? 'right':'left') + ' option').get();
		}
		function _setHistory(item,add){
			var el = $('#'+target.attr('id'))[0];
			// get previous history
			var hxkey = jQuery.data(el,'LastHistoryKey');
            if(hxkey){
                hxkey +=':';
            }else{
                hxkey = '';
            }
            var hxAdd = [];
			var hxRem = [];
            var data = jQuery.data(el,hxkey+'Hx+');
			if(data != undefined){
				hxAdd = jQuery.data(el,hxkey+'Hx+');
			}
			data = jQuery.data(el,hxkey+'Hx-');
			if(data != undefined){
				hxRem = jQuery.data(el,hxkey+'Hx-');
			}
            if(data == undefined){
                data = [];
            }
			// remove from the other array
			var remArr = add ? hxRem : hxAdd;
			if($.inArray(item,remArr)>=0){
				$(remArr).each(function(idx,val){
					if(val == item){
						remArr.splice(idx,1);
					}
				});
			}
			var orig = jQuery.data(target,add?hxkey+'origR':hxkey+'origL');
            if(!$.support.leadingWhitespace){ // this ie >:-{
                if(data == null){
                    if(orig == undefined || orig.indexOf(item) == -1){
                        (add ? hxAdd : hxRem).push(item);
                    }
                }else if(data.indexOf(item) == -1){
                    if(orig == undefined || orig.indexOf(item) == -1){
                        (add ? hxAdd : hxRem).push(item);
                    }
                }
            }else{
			    if($.inArray(item,data) == -1 || jQuery.data(el,(add?hxkey+'Hx+':hxkey+'Hx-')) == undefined){
                    if(orig == undefined){
                        (add ? hxAdd : hxRem).push(item);
                    }else if($.inArray(item,orig) == -1){
					    (add ? hxAdd : hxRem).push(item);
				    }
			    }
            }
			jQuery.data(el,(add?hxkey+'Hx+':hxkey+'Hx-'),(add ? hxAdd : hxRem));
		};
		function _getHistory(rightSide,hxkey){
			if(rightSide == null){rightSide = false};
            if(hxkey == null){hxkey = '';}else{hxkey += ':';}
			var el = $('#'+target.attr('id'))[0];
			try{
                var selector = hxkey+'Hx'+(rightSide?'+':'-');
				return $.unique(jQuery.data(el,selector));
			}catch(e)
			{ 
				return [];
			}
		};
        function _setLastHistoryKey(key){
           jQuery.data(target[0],'LastHistoryKey',key);
        }
	}
})(jQuery);