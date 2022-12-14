import { Animate } from './animate.js';
import { add,addClasses, svgEl, setAttr, mergeDeep,clone } from './util.js';

export function Series(s,props,data,extra){
	if(!props) return this;

	var id = props.id||Math.round(Math.random()*1e8);

	var opt,line,path,pts,o,label;
	var defaultcolor = '#000000';
	if(s==0) defaultcolor = "#E55912";
	else if(s==1) defaultcolor = "#005776";
	else if(s==2) defaultcolor = "#F7AB3D";
	else if(s==3) defaultcolor = "#4A783C";
	opt = {
		'points':{show:true,color:defaultcolor,'stroke-linecap':'round','stroke':defaultcolor,'stroke-width':0,'fill-opacity':1},
		'line':{show:true,color:defaultcolor,'stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'','fill':'none'},
		'bars':{show:false,color:defaultcolor,'stroke-width':0},
		'opt':props.opt||{}
	};
	line = {};
	path = "";
	pts = [];
	label = "";

	// Add the output to the SVG
	this.addTo = function(el){
		add(this.el,el);
		return this;
	};

	// Build group
	this.el = svgEl("g");
	o = {'clip-path':'url(#clip-'+id+')'};
	o['data-series'] = (s+1);
	setAttr(this.el,o);
	addClasses(this.el,['series','series-'+(s+1)]);

	this.getStyle = function(t,p){
		if(opt.hasOwnProperty(t)){
			if(opt[t].hasOwnProperty(p)) return opt[t][p];
		}
		return null;
	};
	this.getProperty = function(pid){
		if(opt.hasOwnProperty(pid)) return opt[pid];
		else return null;
	};
	this.getProperties = function(){ return opt; };
	this.setProperties = function(a){
		if(!a) a = {};
		mergeDeep(opt, a);
		if(!opt.points.color) opt.points.color = defaultcolor;
		if(!opt.points.stroke) opt.points.stroke = defaultcolor;
		if(!opt.line.color) opt.line.color = defaultcolor;
		if(opt.class){
			var c = opt.class.split(/ /);
			addClasses(this.el,c);
		}
		return this;
	};

	this.update = function(){
		var i,pt,txt,p,r,ps,o,ax,a,b,datum,d,old,p1,p2;
		// Check if we need to add a line
		if(!line.el){
			line.el = svgEl("path");
			line.el.classList.add('line');
			setAttr(line.el,{'d':'M0 0 L 100,100'});
			add(line.el,this.el); // Add it to the element
			// Create an animation for the line
			line.animate = new Animate(line.el,{'duration':opt.duration});
		}
		setAttr(line.el,{'style':(opt.line.show ? 'display:block':'display:none'),'stroke':opt.line.color,'stroke-width':this.getStyle('line','stroke-width'),'stroke-linecap':this.getStyle('line','stroke-linecap'),'stroke-linejoin':this.getStyle('line','stroke-linejoin'),'stroke-dasharray':this.getStyle('line','stroke-dasharray'),'fill':this.getStyle('line','fill'),'vector-effect':'non-scaling-stroke'});

		for(i = pts.length; i < data.length; i++){

			data[i].good = (typeof data[i].x==="number");
			if(!data[i].good) data[i].x = 0;

			datum = {'data-i':i};
			// Add any data attributes
			for(d in data[i].data) datum['data-'+d] = data[i].data[d];

			pts[i] = {'title':svgEl("title"),'old':{}};

			if(!data[i].label) data[i].label = "Point "+(i+1);
			txt = (data[i].title || data[i].label+": "+data[i].y.toFixed(2));
			if(pts[i].title) pts[i].title.innerHTML = txt;

			// Do we show a bar?
			if(opt.bars.show){

				// Make a <rect>
				pts[i].bar = svgEl("rect");

				setAttr(pts[i].bar,datum);

				// Update the bar with some default values
				setAttr(pts[i].bar,{'data-series':(s+1),'tabindex':0,'x':0,'y':0,'width':0,'height':0});


				// Add the bar to the element
				add(pts[i].bar,this.el);

				// Add the text label to the bar
				add(pts[i].title,pts[i].bar);

			}

			// Do we show error bars?
			if(data[i].error){
				pts[i].errorbar = {};
				for(ax in data[i].error){
					pts[i].errorbar[ax] = svgEl("line");
					add(pts[i].errorbar[ax],this.el);
				}
			}

			// Do we show the points
			if(opt.points.show){
				pts[i].point = svgEl('circle');

				setAttr(pts[i].point,datum);

				// Update the point
				o = {'cx':0,'cy':0,'tabindex':0};
				o['data-series'] = s+1;
				setAttr(pts[i].point,o);

				add(pts[i].point,this.el);

				// Add animation to point
				pts[i].anim_point = new Animate(pts[i].point,{'duration':opt.duration});

				add(pts[i].title,pts[i].point);
			}

		}
		if(opt.line.label){
			label = svgEl("text");
			label.innerHTML = opt.title;
			var nprops = opt.getXY(data[pts.length-1].x,data[pts.length-1].y);
			nprops['dominant-baseline'] = "middle";
			nprops.fill = opt.line.color;
			if(opt.line.label.padding) nprops.x += opt.line.label.padding;
			setAttr(label,nprops);
			add(label,this.el);
		}

		// Update points/bars
		p = [];
		old = {};

		for(i = 0; i < pts.length; i++){
			r = (opt['stroke-width']||1)/2;

			if(opt.points){
				if(typeof opt.points.size==="number") r = Math.max(opt.points.size,r);
				if(typeof opt.points.size==="function") r = opt.points.size.call(pt,{'series':s,'i':i,'data':data[i]});
			}

			// Set some initial values for the point
			if(pts[i].point) setAttr(pts[i].point,{'r':r,'fill':opt.points.color,'fill-opacity':opt.points['fill-opacity'],'stroke':opt.points.stroke,'stroke-width':opt.points['stroke-width']});
			// Set some initial values for the bar
			if(pts[i].bar) setAttr(pts[i].bar,{'r':r,'fill':opt.points.color,'fill-opacity':opt.points['fill-opacity'],'stroke':opt.points.stroke,'stroke-width':opt.points['stroke-width']});
			
			ps = opt.getXY(data[i].x,data[i].y);
			p.push(ps);

			// Style error bars
			if(pts[i].errorbar && data[i].error){
				// Update error bars
				for(ax in data[i].error){
					a = opt.getXY(data[i].x-data[i].error[ax][0],data[i].y);
					b = opt.getXY(data[i].x+data[i].error[ax][1],data[i].y);
					// If the x-values are numbers we update the attributes
					if(!isNaN(a.x) && !isNaN(b.x)){
						setAttr(pts[i].errorbar[ax],{'x1':roundTo(a.x, 3),'y1':roundTo(a.y, 3),'x2':roundTo(b.x, 3),'y2':roundTo(b.y, 3),'stroke':opt.errorbars.stroke||opt.points.color,'stroke-width':opt.errorbars['stroke-width']||1,'class':'errorbar'});
					}
				}
			}

			// Keep a copy 
			if(typeof pts[i].old.x==="number" && typeof pts[i].old.y==="number"){
				old = clone(pts[i].old);
			}else{
				if(typeof old.x==="number" && typeof old.y==="number") pts[i].old = old;
			}

			// Update point position
			if(pts[i].anim_point) pts[i].anim_point.set({'cx':{'from':pts[i].old.x||null,'to':ps.x},'cy':{'from':pts[i].old.y||null,'to':ps.y}});
			
			if(!data[i].good) setAttr(pts[i].point,{'visibility':'hidden'});

			// Update bar position
			if(pts[i].bar){
				p1 = opt.getXY(Math.max(data[i].xstart||0,extra.axis.x.min),data[i].y + extra.barsize/2);
				p2 = opt.getXY(data[i].x,data[i].y - extra.barsize/2);
				setAttr(pts[i].bar,{'x':p1.x,'y':p1.y,'width':Math.abs(p2.x-p1.x),'height':Math.abs(p2.y-p1.y)});
			}

			// Store the calculated points
			pts[i].old = ps;
		}

		// Update animation
		line.animate.set({'d':{'from':path,'to':p}});

		// Store a copy of the current path
		path = clone(p);

		return this;
	};

	this.setProperties(props);

	return this;
}
