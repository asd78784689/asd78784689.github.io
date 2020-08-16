
// 插件形式的

//整体流程 
//1.对图片进行分类 2.生成dom元素  3.绑定事件   4.显示于页面之中
(function(){
    //用于判断是否能够进行切换 防止太快的进行切换造成bug报错
    let canChange = true;
    //用于判断当前放大显示的图片的下标值
    let curPreviewImgIndex = 0; 

    //存放公共方法
    const methods = {
        //多个子元素放入父元素中循环操作
        appendChild(parent,...children){
            // console.log(children);
            children.forEach((item)=>{
                // console.log(item);
                parent.appendChild(item);
            });
        },
        $(selector,root = document){
            return root.querySelector(selector);
            //模拟为JQ获取dom对象操作 
            //methods.$('#wrap')  == document.querySelector('#wrap')
        },
        $$(selector,root = document){
            //模拟为JQ获取多个dom对象操作 
            return root.querySelectorAll(selector);
        }
    };

    let Img = function(options){
        this._init(options);
        this._createElement();
        this._bind();
        this._show(); 
    }
    //初始化
    Img.prototype._init = function({data,initType,parasitifer}){
        this.parasitifer = methods.$(parasitifer);  //接受内容的dom元素

        this.types = ['全部'];  //所有的分类 用于生成按钮 
        this.all = [];  //所有的图片元素  存放图片元素
        this.classified = {'全部':[]};  //按照类型分类后的图片  用于索引
        this.curType = initType;   //当前显示的图片分类  用于显示高亮和显示内容操作

        this.imgContainer  = null;  //所有图片的容器 之后会更新
        this.wrap = null;   // 整体容器
        this.typeBtnEls = null; // 所有分类按钮组成
        this.figures = null;    //图片item组成的数组

        this.overlay = null;   //遮罩层
        this.previewImg = null; //被点击的图片
        //进行图片的分类操作
        this._classify(data);
        console.log(this.classified);
        //
    };

    //接受图片的数据进行分类
    Img.prototype._classify = function(data) {
        //this.all中为存放所有的图片 
        //this.classified中，通过类型type作为属性对应存放在this.all中相同类型的图片的下标值
        //例如 this.all中为['type=1','type=2','type=3','type=2','type=3']
        //this.classified中就是{'全部':[0,1,2,3,4],'type=1':[0],'type=2':[1,3],'type=3':[2,4]}
        //以此类推 this.types 中就是['全部','type=1','type=2','type=3']

        let srcs = [];  //存放所有图片的src
        data.forEach(({title,type,alt,src},index) =>{
            //通过遍历数据进行生成图片
            if(!this.types.includes(type)){
                //如果所有的分类中没有当前传入的分类就加入
                this.types.push(type);
            }

            if(!Object.keys(this.classified).includes(type)){
                //如果属性中没有type对应的属性就加入
                this.classified[type] = [];
            }

            if(!srcs.includes(src)){
                //说明图片没有生成过
                //那就生成图片并添加到对应分类中
                //将src地址添加进srcs之中
                srcs.push(src);
                //生成一个figure 用于作为图片的item
                let figure = document.createElement('figure');
                let img = document.createElement('img');
                let figcaption = document.createElement('figcaption');
                img.src = src;
                img.setAttribute('alt',alt);
                figcaption.innerText = title;
                //将两个子元素放入figure之中 这样就形成一个item
                methods.appendChild(figure,img,figcaption); 
                //将这个item放入this.all之中保存 
                this.all.push(figure);
                //在对应type分类的数组中添加刚加入到this.all之中的最后一项
                //其实可以直接写成figure 
                this.classified[type].push(this.all.length-1);
            }else{
                //说明图片生成过 那么就去all中找对应图片添加到对应分类中
                //srcs 和 all 的顺序是一样的 所以在srcs中获取对应的下标再到all中返回到值即可
                
                //!!!s1 相当于循环了srcs中的各个值 然后用该值去与src对比
                //返回成功的的下标值
                this.classified[type].push(srcs.findIndex( s1 => s1 === src));
                //如果没有srcs 就得靠all里 获取img的src 再去进行对比
                // console.log(this.all[0].querySelector('img').src);
            }
        })

    }

    //生成dom元素
    Img.prototype._createElement = function() {
        let typesBtn = [];
        for(let type of this.types.values()){
            //对this.types 进行遍历循环 使用.values()只是多了个返回值 一个遍历器对象 
            //其实可以不加
            typesBtn.push(`<li class="__Img__classify__type-btn ${type === this.curType ? '__Img__type-btn-active' : '' }">${type}</li>`);
            //循环添加到typesBtn之中 这是每个按钮 用于切换分类
            //用type的值进行判断 如果与this.curType相等 说明是要高亮显示的 那就加上对应的class 否则就是空
        }
        // console.log(typesBtn);

        //整体的模板
        //用join方法放入 
        let tamplate = `<ul class="__Img__classify">${typesBtn.join('')}</ul>
                        <div class="__Img__img-container"></div>`;

        let wrap = document.createElement('div');
        wrap.className = '__Img__container';
        wrap.innerHTML = tamplate;
        //以wrap为父节点 搜索__Img__img-container的dom节点元素
        this.imgContainer = methods.$('.__Img__img-container',wrap);

        // console.log(this._getImgsByType(this.curType));
        // this.imgContainer.appendChild(this._getImgsByType(this.curType)[0]);
        //将对应类型的图片通过循环加入到this.imgContainer之中 记得要用扩展 
        //不然会出错
        methods.appendChild(this.imgContainer,...this._getImgsByType(this.curType));
        //存放一些参数wrap typeBtnEls figures
        this.wrap = wrap;
        this.typeBtnEls = [...methods.$$('.__Img__classify__type-btn',wrap)];
        //保存为一个数组
        this.figures = [...methods.$$('figure',wrap)];
        // 将整一个wrap内容元素放入 接受内容的dom元素(传入的接受区域) 测试用
        // methods.appendChild(this.parasitifer,wrap);
        // document.body.appendChild(this.parasitifer);

        //实现点击图片时 放大图片后的遮罩层
        let overlay = document.createElement('div');
        overlay.className = '__Img__overlay';
        overlay.innerHTML = `<div class="__Img__overlay-prev-btn"></div>
                             <div class="__Img__overlay-next-btn"></div>
                             <img src="" alt="">`;
        //放置于wrap之中
        methods.appendChild(this.wrap,overlay);
        this.overlay = overlay;
        this.previewImg = methods.$('img',overlay);
        //对图片item进行position的top和left值进行初始化设置
        this._calcPosition(this.figures);
    }
    //通过类型获取图片
    Img.prototype._getImgsByType = function(type){
        return type === '全部' ? [...this.all] : this.classified[type].map(index => this.all[index]);
        //如果 type 为全部 那么就将all整个返回;
        //如果不是 则通过type在classified中获取到对应的下标集合 然后用map方法循环
        //将每一个下标值通过this.all[]获取到图片 然后组成新的数组返回回去
    };
    //绑定事件
    Img.prototype._bind = function(){
        //实现点击按钮实现分类切换事件
        methods.$('.__Img__classify',this.wrap).addEventListener('click',({target}) =>{
            //绑定在父元素上 通过点击获取event对象 再用解构赋值获取到对应点击的子元素
            //即通过事件代理达到绑定点击事件
            //点击的不是li就返回 说明不是点击的按钮
            if(target.nodeName !== 'LI') return;
            // console.log(target.innerText);
            //如果为false时 就返回 代表正在进行动画中 如果为true表示没有动画或者已经完成了
            if(!canChange) return;
            canChange = false;

            //点击的对应类型
            const type = target.innerText;
            //通过type值获取对应图片 用于与当前显示的进行对比 好之后操作显示隐藏
            const els = this._getImgsByType(type);
            // console.log(this.figures);

            //比对当前显示的图片是否与点击的类型中有一样的
            //通过循环this.figures 即当前显示图片的item集合
            //获取到这些显示中的图片item下的img元素中的src值 组成一个数组 
            //之后进行比对判断
            let prevImgs = this.figures.map(figure => methods.$('img',figure
                ).src); 
            //通过循环els 即点击的type类型下的图片的item集合
            //获取到该类型下的集合中的img元素中的src属性值 组成数组
            let nextImgs = els.map(figure => methods.$('img',figure
                ).src); 
            //判断是否有相同图片存在 返回一个数组 存放为相同图片之前的下标和现在的下标的数组
            const diffArr = this._diff(prevImgs,nextImgs);
            // console.log(diffArr);
            diffArr.forEach(([,i2]) =>{
                //every() 方法用于检测数组所有元素是否都符合指定条件（通过函数提供）。
                //every() 方法使用指定函数检测数组中的所有元素：
                //如果数组中检测到有一个元素不满足，则整个表达式返回 false ，且剩余的元素不会再进行检测。
                //如果所有元素都满足条件，则返回 true。
                this.figures.every( (figure,index) => {
                    //这里就是通过检测this.figures中的每一项figure  index为索引值
                    let src = methods.$('img',figure).src;
                    //获取当前遍历到的figure的img的src值
                    if(src === nextImgs[i2]){
                        //如果是与即将显示的图片item中对应位置的item相同的src
                        //说明是同一张那么就不用去生成 直接使用即可
                        //先将它从当前显示的图片item列表中删除 防止等下隐藏时隐藏它
                        this.figures.splice(index,1);
                        return false;
                        //return false 可以直接中断检测了 因为已经找到了
                    }
                    return true;
                    //进行下一个figure的检测，直到全部检测完毕或者遇到false
                });
            });
            //设置即将显示的图片的position的值
            this._calcPosition(els);

            //进行过滤
            //保存需要加入的els元素 即需要添加的图片item集合
            let needAppendEls = [];
            if(diffArr.length){
                //说明存在相同图片 将相同的过滤出来保留 不同的隐藏

                //将下一个显示图片中已存在的提取出来组成一个数组
                let nextElsIndex = diffArr.map( ([,i2]) => i2); 
                els.forEach( (figure,index) => {
                    //循环即将显示图片item组 如果不存在
                    //通过下标值的数组nextElsIndex 判断需要显示的item中是否已经存在
                    //将现在不存在没显示的图片item 添加到needAppendEls之中 之后一并添加显示
                    if(!nextElsIndex.includes(index)){
                        //说明当前循环到的figure不存在于当前显示之中
                        needAppendEls.push(figure);
                    }
                });
            }else{  
                //不存在相同图片就直接将当前显示的全部隐藏()
                needAppendEls = els;
            }
            //进行隐藏操作
            this.figures.forEach( el => {
                el.style.transform = 'scale(0,0) translate(0,100%)';
                el.style.opacity = '0';
            });
            
            //将需要添加的els放入容器中
            methods.appendChild(this.imgContainer,...needAppendEls);
            //进行动画效果的过渡显示
            setTimeout( () =>{
                els.forEach(el=>{
                    el.style.transform = 'scale(1,1) translate(0,0)';
                    el.style.opacity = '1';
                });
            });
            //对 this.figures 进行更新 
            setTimeout(() =>{
                // 将目前保存的值一一remove删除掉
                this.figures.forEach(figure =>{
                    this.imgContainer.removeChild(figure);
                });
                //替换为els的值
                this.figures = els;
                //动画结束时更改为true 表示可以进行下一次的切换了
                canChange = true;
            },600);

            //切换按钮高亮样式
            this.typeBtnEls.forEach( (btn) =>{
                btn.className = '__Img__classify__type-btn';
            });
            //给被点击按钮加上高亮的class
            target.classList.add('__Img__type-btn-active');
            // console.log(target.className);

        });
        //实现点击图片的放大和遮罩层
        this.imgContainer.addEventListener('click',({target})=>{
            //点击对象若不是figure或者figcaption元素就返回
            if(target.nodeName !== 'FIGURE' && target.nodeName !== 'FIGCAPTION') return;
            //点击到文字说明时候 让点击对象修改为父元素也就是figure 不然会获取不到图片数据
            if(target.nodeName === 'FIGCAPTION') target = target.parentNode;
            // 这样就能获取到点击对象的图片src
            console.log(methods.$('img',target).src);

            const src = methods.$('img',target).src;

            //在当前显示的图片中的src进行对比 获取到当前点击图片所在下标值
            curPreviewImgIndex = this.figures.findIndex(figure => src === methods.$('img',figure).src);

            //将点击对象的图片的src地址设置为遮罩层的的img的src
            this.previewImg.src = src; 
            //
            console.log(this.overlay);
            // 修改为flex并透明度改为1即可
            this.overlay.style.display = 'flex';    

            //将透明度改为1作为动画效果显示 所以要放在定时器中作为异步任务
            setTimeout( ()=>{
                this.overlay.style.opacity = '1';
            });

        });
        //点击遮罩层隐藏遮罩
        this.overlay.addEventListener('click',()=>{
            // 先进行动画效果的隐藏透明度
            this.overlay.style.opacity = '0';
            // 在通过一定的延迟执行none的操作 时间为transition的时间
            setTimeout( ()=>{
                this.overlay.style.display = 'none';
            },300);
        });
        //实现上一张图片的点击切换操作
        methods.$('.__Img__overlay-prev-btn',this.overlay).addEventListener('click',e=>{
            //阻止冒泡 !!!! 不然会触发之前的隐藏遮罩层的事件
            e.stopPropagation();
            // 进行-1操作
            curPreviewImgIndex =  -1>=0 ? curPreviewImgIndex-1 : this.figures.length-1;
            // console.log(this.figures);
            // 修改当前显示图片的src值
            this.previewImg.src = methods.$('img',this.figures[curPreviewImgIndex]).src;

        });
        //实现下一张图片的点击切换操作
        methods.$('.__Img__overlay-next-btn',this.overlay).addEventListener('click',e=>{
            //阻止冒泡
            e.stopPropagation();
            // 进行+1操作
            curPreviewImgIndex = curPreviewImgIndex+1 == this.figures.length ? 0 : curPreviewImgIndex+1;
            // console.log(this.figures);
            // 修改当前显示图片的src值
            this.previewImg.src = methods.$('img',this.figures[curPreviewImgIndex]).src;
        });
    };
    //判断数组是否有相同的元素
    Img.prototype._diff = function(prevImgs,nextImgs){
        let diffArr = [];
        //循环当前显示的图片item组
        prevImgs.forEach((src1,index1) =>{
            //通过每一个src值对下一个显示图片item数组进行find操作 并一一对比
            let index2 = nextImgs.findIndex(src2 => src1 === src2);
            //如果不是-1 说明该src存在于下一个显示type之中
            if(index2 !== -1){
                //加入一个[] 为当前的图片所在的下标 和 之后显示所在下标 
                diffArr.push([index1,index2]);
            }
        });

        return diffArr;
    }



    //显示
    Img.prototype._show = function(){
        //将内容放入传入的dom节点位置中
        methods.appendChild(this.parasitifer,this.wrap);
        
        //让所有的图片item显示出来 并将其放在setTimeout中 作为异步操作
        //使得当同步任务都结束时候才运行显示图片的操作 达到图片的显示会有动画效果的
        setTimeout(()=>{
            this.figures.forEach((figure) =>{
                figure.style.transform = 'scale(1,1) translate(0,0)';
                figure.style.opacity = '1';
            }); 
        });
    };
    //设置图片item的position值
    Img.prototype._calcPosition = function(figures){
        let horizontalImgIndex = 0;  //代表当前行数中 该图片的所在位置
        //因为图片item设置的为absolute的position 所以每个item都需要添加各自的top与left值
        //用absolute保证脱离了文档流 之后进行图片内容的切换时候不会出现bug 但还有其他的实现方法还需要再次去尝试

        //假设有10张图片 一行有4张 第五张的取值就是  parseInt(index/4) + 1 => 2 也就是第二行
        //
        figures.forEach((figure,index) =>{
            // 140为图片高度 15为间距高度 比如第二行就是距离顶部一张图片+15的间距的top值了
            figure.style.top = parseInt (index/4) * 140 + parseInt(index/4) *15 + 'px';
            // 通过当前行数下 图片的位置 判断left的值
            //比如第一行的第一张就是 0*240+0*15 第二章就是1*240+1*15 
            figure.style.left = horizontalImgIndex *240 +horizontalImgIndex*15 +'px';
            //添加一个-100%的translate 让图片item的动画效果看起来是从顶部开始加载进来的
            figure.style.transform = 'scale(0,0) translate(0,-100%)';
            //设置完当前的图片item后就进行累加用于下一张图片 如果超过4 就会因为求余而变回0
            //代表下一张已经是下一行的第一张图片item了 比如 1%4 = 1 4%4 = 0 
            horizontalImgIndex = (horizontalImgIndex+1) %4;
        });

        //设置背景容器的高度 因为图片item设置为了absolute 所以背景容器无高度
        //通过判断图片item行数 为容器高度赋值 
        //判断总共几行 通过取余数判断是否需要多一行
        let len = parseInt(figures.length / 4)+(figures.length%4 > 0 ? 1 : 0);
        //又或者可以用Math.ceil() 它会向上取整 就简单一些
        //let len = Math.ceil(figures.length/4);
        this.imgContainer.style.height = len*140 + (len-1) * 15 + 'px';
    }

   
   window.$Img = Img; 
})();