
$(document).ready(function () {

    const firebaseConfig = {
        apiKey: "AIzaSyCBmK4AbGuze_pH7r5dZpMCEIgpUGKwSYM",
        authDomain: "proferonald.com",
        databaseURL: "https://proferonald-fb-default-rtdb.firebaseio.com",
        projectId: "proferonald-fb",
        storageBucket: "proferonald-fb.appspot.com",
        messagingSenderId: "647906089395",
        appId: "1:647906089395:web:72421f937bbf9f6a3693c6",
        measurementId: "G-JYVC11X4W4"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    //firebase.getAnalytics(firebaseConfig);

    $(document).on("click", ".terminos", function (e) {
        e.preventDefault();

        var arch = $(this).attr('href').split('#')[1];

        fetch('assets/htmls/' + arch + '.html').then(x => x.text()).then(html => {

            $('#modal-html').html(html);
            $('#modal-html').trigger('click');

        })


    });

    $(document).on("input", "#tagsnot", function (e) {

        $(this).val($(this).val().replace(/\s+/g, ''));

    });

    var pid = new URLSearchParams(
        document.location.search.substring(1)
    ).get("pid");

    if (pid != '' && pid != null) {
        $('#dato').removeAttr('pagina-principal');
        VerPost('-' + UnCriptoRD(pid));
    } else {
        VerPostMinis(firebase.database().ref('articulos').limitToLast(6));
    }

    $(document).on("click", ".show-publicacion", function (e) {
        e.preventDefault();
        var id = $(this).attr('href').split('#')[1];
        VerPost(id, $('#dato').attr('video' + id));

    });

    var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    function VerPost(id, v = 0, u=0) {

        $('section').hide();

        if ($('#publicacion').attr('post-publicado') != id) {

            $('#dato').removeAttr('sig-til');
            $('#dato').removeAttr('sig-id');

            firebase.database().ref('articulos').orderByKey().limitToFirst(1).startAfter(id).on('value', function (sigs) {

                sigs.forEach(function (sig) {
                    $('#dato').attr('sig-til', sig.val().titulo);
                    $('#dato').attr('sig-id', sig.key);
                });

            });

            firebase.database().ref('articulos').orderByKey().limitToLast(2).endAt(id).once('value', function (iants) {

                var i = 0;
                var ants = [];
                iants.forEach(function (iant) {
                    ants[i] = iant;

                    i++;
                });

                ants.reverse();

                var tags = '';

                if(ants[0].key == id && (ants[0].val().activo == 1 || u==1)) {

                    $('title').html(ants[0].val().titulo + ' - ProfeRonald - Blog');

                    
                    var cats = '';
                    if (ants[0].val().categorias != undefined) {
                        tags = ants[0].val().categorias.replace(/\s+/g, '');
                        var categorias = tags.split(',');
                        categorias.forEach(function (cat) {
                            cats += '<li><a href="#cat-' + cat + '" class="ml-1">' + cat + '</a></li>';
                        });
                    }

                    var fecha = ants[0].val().fecha;
                    var date = new Date(fecha);

                    var fechanot = date.getDate() + ' ' + meses[date.getMonth()];

                    var sdate = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();

                    var imgnot = ants[0].val().imagen;

                    if (imgnot == '' || imgnot == 'undefined' || imgnot == undefined) {
                        imgnot = 'assets/images/noticia.png';
                    }

                    if (imgnot.substring(0, 26) == 'https://youtube.com/embed/') {
                        $("iframe").each(function () {
                            var src = $(this).attr('src');
                            $(this).attr('src', src);
                        });
                        var imgvid = '<iframe id="video-fixed" width="450" height="260" src="' + imgnot + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><div class="text-center btn-link" id="cerrar-video" style="display:none">&times; Cerrar</div>';
                    } else {
                        var imgvid = '<img class="featured-image img-fluid rounded float-left mr-2" style="width:100%" src="' + imgnot + '" alt="' + ants[0].val().titulo + '" />';
                    }

                    var linksig = '';
                    if ($('#dato').attr('sig-id') != '' && $('#dato').attr('sig-id') != undefined) {
                        linksig = '<a class="thepostlink show-publicacion" href="#' + $('#dato').attr('sig-id') + '">' + $('#dato').attr('sig-til') + ' »</a>';
                    }

                    var linkant = '';
                    if (ants[1] != undefined && ants[1].key != undefined && ants[1].key != '') {
                        linkant = '<a class="thepostlink show-publicacion" href="#' + ants[1].key + '">« ' + ants[1].val().titulo + '</a>';
                    }

                                
                    var url = `${encodeURIComponent('https://proferonald.com/?post=' + `${encodeURIComponent(ants[0].val().titulo)}`  + '&pid=' + EnCripto(ants[0].key))}`;

                    var contenido = ants[0].val().contenido.replace(/\n/g, "<br>");

                    $('#publicacion').html('<div class="mainheading"><!-- Post Categories --><input type="hidden" value="' + tags + '" class="tags-cats"><div class="after-post-tags"><ul class="tags">' + cats + '</ul></div><!-- End Categories --><!-- Post Title --><h1 class="posttitle">' + ants[0].val().titulo + '</h1><span style="display:none" class="edicion"><span class="edicion elnot" idp="' + id + '"><i class="fa fa-trash"></i></span> | <a href="#formnov" class="edicion" idp="' + id + '" id="editar-post"> <i class="fa fa-pencil"></i></a></span></div><!-- Post Featured Image/Video --><input class="activonot" type="hidden" value="' + ants[0].val().activo + '" /><div class="float-left rounded mr-2" id="video-container" video="1"><div>' + imgvid + '</div><div class="text-right m-0 p-0 title-pr" title="Fijar video" data-content="Coloca el video en la parte superior derecha" data-original-title="Fijar video" style="cursor:pointer;display:none" id="top-video"><i class="fa fa-window-restore" aria-hidden="true"></i></div></div><!-- End Featured Image/Video --><!-- Post Content --><div class="article-post wraper-pr"><span class="d-none">' + ants[0].val().contenido + '</span><div class="capital-pr">' + contenido + '</div><div class="clearfix"></div></div><!-- Post Date --><p><small><span class="post-date"><time class="post-date" datetime="' + sdate + '">' + fechanot + '</time></span></small><h3 class="text-right"><i class="fa fa-share-alt" aria-hidden="true"></i> Comparte: <a href="https://www.facebook.com/sharer/sharer.php?u=' + url +'" target="blank" style="color:#008bf0" title="Compatir en Facebook"><i class="fa fa-facebook ml-2" aria-hidden="true"></i></a> <a href="https://twitter.com/intent/tweet?text='+ants[0].val().titulo+'&amp;url='+url+'" style="color:#009ef0" target="blank" title="Compatir en Twitter"><i class="fa fa-twitter ml-2" aria-hidden="true"></i></a> <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url='+url+'&amp;title='+ants[0].val().titulo+'&amp;summary='+ants[0].val().titulo+'&amp;source='+url+'" style="color:#0068c2" target="blank" title="Compartir en Linkedin"><i class="fa fa-linkedin ml-2" aria-hidden="true"></i></a><a href="https://web.whatsapp.com/send?text=*'+ants[0].val().titulo+':*%0A'+url+'" style="color:##00cd64" target="blank" title="Compartir en WhatsApp" class="d-none d-md-inline-block"><i class="fa fa-whatsapp ml-3" aria-hidden="true"></i></a><a href="whatsapp://send?text='+url+'" target="blank" title="Compartir en WhatsApp" class="d-md-none"><i class="fa fa-whatsapp ml-3" aria-hidden="true"></i></a> <a href="#a" style="color:gray" id="copiar-enlace" url="'+url+'" title="Copiar enlace"><i class="fa fa-link ml-2" aria-hidden="true"></i></a></h3><div id="copiar-enlace-aviso" style="display:none" class="text-right text-primary">&iexcl;Enlace copiado!</div></p><!-- Prev/Next --><div class="row PageNavigation mt-4 prevnextlinks"><div class="col-md-6 rightborder pl-0">' + linkant + '</div><div class="col-md-6 text-right pr-0">' + linksig + '</div></div><!-- End Prev/Next --><!-- Begin Comments ================================================== --><section><div id="comments"><section class="disqus"><div id="disqus_thread"></div></section> </div></section><!--End Comments================================================== -->');

                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                }

            });

            $(document).on("click", "#copiar-enlace", function (e) {
                e.preventDefault();
                
                var url = decodeURIComponent($(this).attr('url'));
                if(navigator.clipboard.writeText(url)){

                    $("#copiar-enlace-aviso").show();
                setTimeout(function () {
                                                    

                    $("#copiar-enlace-aviso").hide();
                     
                     }, 3000);

                    }
            });

            $(document).on("click", "#cerrar-video", function (e) {
                e.preventDefault();
                $("#video-fixed").parent().css({ 'z-index': 'auto', 'position': 'static', 'top': 'auto', 'right': 'auto' });
                $("#cerrar-video").hide();
                $("#video-container").removeAttr('video');
                $("#top-video").show();

            });

            $(document).on("click", "#top-video", function (e) {
                e.preventDefault();
                $("#video-fixed").parent().css({ 'z-index': '1031', 'position': 'fixed', 'top': '2%', 'right': '2%' });
                $("#cerrar-video").show();
            });

            function Linkify(inputText) {
                //URLs starting with http://, https://, or ftp://
                var replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
                var replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
        
                //URLs starting with www. (without // before it, or it'd re-link the ones done above)
                var replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
                var replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
        
                //Change email addresses to mailto:: links
                var replacePattern3 = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;
                var replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
        
                return replacedText
            }

            $(window).scroll(function () {
                if ($("#video-container").length > 0 && $("#video-container").attr('video') == 1) {
                    var scrls = $("#video-container").offset().top;
                    var scrl = $(window).scrollTop();
                    if (scrl > scrls) {
                        $("#video-fixed").parent().css({ 'z-index': '1031', 'position': 'fixed', 'top': '2%', 'right': '2%' });
                        $("#cerrar-video").show();
                    }

                }

            });

            $('#publicacion').attr('post-publicado', id);

        }

        $('.recent-posts').show();
        $('.publicaciones').hide();
        $('#publicacion').show();
        $('.site-content').css({ 'margin-top': '3px', 'padding-top': '35px' });

        firebase.database().ref('comentarios/' + id).limitToLast(100).on('value', function (comentarios) {

            var icoms = [];
            var ids = [];
            var i = 0;
            comentarios.forEach(function (icom) {
                icoms[i] = icom;
                ids[i] = icom.val().usuario;
                i++;
            })

            icoms.reverse();

            var coms = '';

            icoms.forEach(function (com) {
                comm = com.val().comentario.replace(/\$\$(.*?)\$\$/gi, "<math-field read-only>$1</math-field>");
                comm = comm.replace(/\$(.*?)\$/gi, "<math-field style='display: inline-block;' default-mode='inline-math' read-only>$1</math-field>");
                coms += '<div class="d-flex flex-start mt-2 ' + com.val().usuario + '" id="' + com.key + '"><img class="rounded-circle border border-success photoURL" src="assets/images/usuario.png" style="min-width:45px;min-height:45px;max-height:45px;max-wight:45px" alt="An&oacute;nimo" /><div class="flex-grow-1 flex-shrink-1"><div class="ml-3"><div class="d-flex justify-content-between align-items-center"><p class="mb-1 text-info font-weight-bold"><span class="displayName">An&oacute;nimo</span><span class="small">- Hace ' + HaceTiempo(com.val().fecha) + '</span><span class="edicion elcom" idp="' + id + '" idc="' + com.key + '"> - <i class="fa fa-trash"></i></span></p><a href="#!" class="responder"  idc="' + com.key + '" style="z-index:99999"><span class="small"><i class="fa fa-reply"></i> responder</span></a></div><p class="small mb-0 wraper-pr max-width-pr" style="overflow:hidden;">' + comm + '</p></div>';

                firebase.database().ref('comentarios/' + id + '/' + com.key + '/respuestas').limitToLast(100).on('value', function (respuestas) {
                    if (respuestas.exists()) {
                        var reps = [];
                        var h = 0;
                        respuestas.forEach(function (resp) {

                            reps[h] = '<div class="d-flex flex-start mt-4 h' + com.key + ' ' + resp.val().usuario + '"><a href="#"><img class="rounded-circle photoURL" src="assets/images/usuario.png" alt="An&oacute;nimo" style="min-width:45px;min-height:45px;max-height:45px;max-wight:45px" /></a><div class="flex-grow-1 flex-shrink-1 ml-3"><div><div class="d-flex justify-content-between align-items-center"><p class="mb-1"><span class="displayName">An&oacute;nimo</span> <span class="small">- Hace ' + HaceTiempo(resp.val().fecha) + '</span><span class="edicion elresp" idp="' + id + '" idc="' + com.key + '" idr="' + resp.key + '"> - <i class="fa fa-trash"></i></span></p></div><p class="small mb-0 max-width-pr" style="overflow:hidden">' + resp.val().respuesta + '</p></div></div></div>';

                            ids[i] = resp.val().usuario;
                            i++;

                            h++;
                        })

                        reps.reverse();

                        if (reps != '') {
                            coms += reps.join('');
                        }
                    }

                })

                coms += '</div></div>';

            })

            if (coms != '') {
                coms = Linkify(coms);
                $('#comentarios').html(coms);
                $('.comentarios').show();
                $('#comentarios').show();
            }

            var width = $('.comentarios').css('width').split('px')[0];
            if (width > 240) {
                $('.max-width-pr').css({ 'max-width': (width - 240) + 'px', 'width': '100%' });
            }

            var ids = [...new Set(ids)];
            
            ids.forEach(function (u) {
                firebase.database().ref().child('usuarios/' + u).on('value', function (usr) {
                    if (usr.exists()) {
                        
                        $('.' + u + ' .photoURL').attr('src', usr.val().photoURL);
                        $('.' + u + ' .photoURL').attr('alt', usr.val().displayName);
                        $('.' + u + ' .displayName').text(usr.val().displayName);
                    }
                });

            });




        });

        $('#comentando').hide();

        firebase.auth().onAuthStateChanged(userInfo => {
            $('#comentando').hide();
            $('.edicion').hide();
            if (userInfo) {

                if (id != '') {
                    $('#comentando img').attr('src', userInfo.photoURL);
                    $('#comentando img').attr('alt', userInfo.displayName);
                    $('#comentar').html('Publicar como ' + userInfo.displayName);
                    $('#comentar').attr('idp', id);
                    $('.comentarios').show();
                    $('#comentando').show();
                }
                setTimeout(function () {
                                                    

               const btau = window.btoa(EnCripto(userInfo.email));
                if ((btau == 'LnRyNG9XbnNhUWx3ZFJAZ2dNbWthMWlQbGouWWN1b09tbg==') && userInfo.email != '') {$('.edicion').show();}
                
                }, 10000);


            }
        })

    }

    window.onresize = function (event) {
        var width = $('.comentarios').css('width').split('px')[0];

        if (width > 240) {
            $('.max-width-pr').css({ 'max-width': (width - 240) + 'px', 'width': '100%' });
        }

    }

    function HaceTiempo(fecha) {

        var hoy = $.now() / 1000;
        var hace = hoy - (fecha / 1000);

        var s = Math.round(hace);
        var m = Math.round(hace / 60);
        var h = Math.round(hace / 3600);
        var d = Math.round(hace / 86400);
        var w = Math.round(hace / 604800);
        var me = Math.round(hace / 2600640);
        var a = Math.round(hace / 31207680);

        if (s < 60 || s == 60) {

            if (s < 1) {
                var tiempo = "un segundo";
            } else {
                var tiempo = s + " segundos";
            }
        } else {
            if (m < 60 || m == 60) {
                if (m == 1) {
                    var tiempo = "un minuto";
                } else {
                    var tiempo = m + " minutos";
                }
            } else {

                if (h < 24 || h == 24) {
                    if (h == 1) {
                        var tiempo = "una hora";
                    } else {
                        var tiempo = h + " horas";
                    }
                } else {
                    if (d < 7 || d == 7) {
                        if (d == 1) {
                            var tiempo = "un d&iacute;a";
                        } else {
                            var tiempo = d + " d&iacute;as";
                        }
                    } else {

                        if (w < 4.3 || w == 4.3) {
                            if (w == 1) {
                                var tiempo = "una semana";
                            } else {
                                var tiempo = w + " semanas";
                            }
                        } else {

                            if (me < 12 || me == 12) {
                                if (me == 1) {
                                    var tiempo = "un mes";
                                } else {
                                    var tiempo = me + " meses";
                                }
                            } else {

                                if (a == 1) {
                                    var tiempo = " un a&ntilde;o";
                                } else {
                                    var tiempo = a + " a&ntilde;os";
                                }

                            }


                        }

                    }

                }

            }

        }


        return tiempo;
    }

    $(document).on("click", ".show-principal", function (e) {
        e.preventDefault();

        $('section').hide();
        if ($('#dato').attr('pagina-principal') == 1) {
            $('.intro').show();
            $('.featured-posts').show();
            if ($('#publicaciones').attr('posts-publicados') == 1) {
                $('.recent-posts').show();
                $('#publicacion').hide();
                $('.publicaciones').show();
            }
        } else {

            $('#dato').attr('pagina-principal', 1);
            VerPostMinis(firebase.database().ref('articulos').limitToLast(6));
        }

    });

    $(document).on("click", "#show-about", function (e) {
        e.preventDefault();

        $('section').hide();
        if ($('#about').attr('cache') == 1) {


            fetch('assets/htmls/about.html').then(x => x.text()).then(html => {

                $('#about').html(html);
                $('#about').removeAttr('cache');

            })




        }

        $('#about').show();

    });

    $(document).on("click", ".set-value", function (e) {
        e.preventDefault();

        let ruta = $(this).attr('ruta');
        let val = $(this).val();

        firebase.database().ref(ruta).set(val);

    });



    $(document).on('click', '#entrar', function () {

        Sesion();

    });


    function EnCripto(clave) {
        var c = "t,4,W,s,Q,w,R,g,M,k,1,P,j,Y,u,O,n,5,G,m,E,e,V,l,A,i,C,0,y,U,7,6,h,L,c,I,q,X,v,K,a,F,1,N,f,H,x,3,D,d,T,o,S,2,z,B,r,J,9,b,Z,p";
        clave = clave.substring(1);
        c = c.split(',');
        var iclave = '';
        for (i = 0; i < clave.length; i++) {
            iclave += clave.substr(i, 1) + c[i];
        }

        return iclave;
    }


    function UnCriptoRD(clave) {
        var nclave = '';
        for (n = 0; n < clave.length; n++) {
            if (n % 2 == 0) {
                nclave += clave.substr(n, 1);
            }
        }

        return nclave;
    }


    function VerPostMinis(fbpost, p = 1) {

        fbpost.on('value', function (noticias) {


            var nots = '';
            var pnots = '';
            var carr = new Array();
            var carri = new Array();
            var notis = [];
            var i = 0;
            var k = 0;
            var h = 0;

            noticias.forEach(function (not) {

                if(not.val().activo == 1){
                var notkey = not.key;
                var titulonot = not.val().titulo;
                var valcontnot = not.val().contenido;
                var lcontnot = valcontnot.length;
                var imgnot = not.val().imagen;

                if (imgnot == '' || imgnot == 'undefined' || imgnot == undefined) {
                    imgnot = 'assets/images/noticia.png';
                }

                var fecha = not.val().fecha
                var date = new Date(fecha);

                var fechanot = date.getDate() + ' ' + meses[date.getMonth()];
                
                var leermas = '';

                if (lcontnot > 296) {
                    contnot = '<p class="text-articulo text-justify">' + removeTags(valcontnot).substring(0, 296) + '...</p>';
                    leermas += '<div class="row"><div class="col-6 post-date">'+fechanot+'</div><div class="col-6"><a href="#' + notkey + '" class="show-publicacion read-more btn btn-sm btn-primary" ><i class="fa fa-link"></i> Leer m&aacute;s</a></div>';
                } else {
                    contnot = '<p class="text-articulo">' + valcontnot + '</p>';
                }

                notis[h] = { 'notkey': notkey, 'titulonot': titulonot, 'valcontnot': valcontnot, 'imgnot': imgnot, 'contnot': contnot, 'fechanot': fechanot, 'leermas': leermas }
                h++;
            }
            
            })

            notis.reverse();

            var img = '';

            var lnotkey = [];

            notis.forEach(function (noti) {

                lnotkey[i] = noti['notkey'];

                if (noti['imgnot'].substring(0, 26) == 'https://youtube.com/embed/') {
                    var imgvidnot2 = '<div><iframe width="305" height="auto" src="' + noti['imgnot'] + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" class="img-fluid" allowfullscreen></iframe></div>';
                    var imgvidnot3 = '<div><iframe width="305" height="auto" src="' + noti['imgnot'] + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" class="img-fluid blog-img" allowfullscreen></iframe></div>';

                } else {
                    var imgvidnot2 = '<a href="#' + noti['notkey'] + '" class="show-publicacion"><img class="img-fluid rounded" src="' + noti['imgnot'] + '" alt="' + noti['titulonot'] + '"></a>';
                    var imgvidnot3 = '<a href="#' + noti['notkey'] + '" class="show-publicacion"><div class="thumbnail rounded" style="background-image:url(' + noti['imgnot'] + ');"></div></a>';
                }

                if (i > 1 || p > 1) {

                    nots += '<!-- begin post --><div class="col-md-6 grid-item nots"><div class="card-block"><div class="card"><h2 class="card-title"><a href="#' + noti['notkey'] + '" class="show-publicacion">' + noti['titulonot'] + '</a></h2>' + imgvidnot2 + '<h4 class="card-text wraper-pr">' + noti['contnot'] + noti['leermas'] + '</h4><h4><div class="metafooter mt-4"><div class="wrapfooter w-50"><span class="author-meta"><span class="post-date">' + noti['fechanot'] + '</span></span><div class="clearfix"></div></div></div></h4></div></div></div><!-- end post -->';

                } else if (p == 1) {

                    pnots += '<!-- begin post --><div class="col-sm-6 pnots"><div class="card"><div class="row"><div class="col-md-5 wrapthumbnail border-right border-primary">' + imgvidnot3 + '</div><div class="col-md-7"><div class="card-block"><h2 class="card-title"><a href="#' + noti['notkey'] + '" class="show-publicacion">' + noti['titulonot'] + '</a></h2><h4 class="card-text wraper-pr">' + noti['contnot'] + noti['leermas'] + '</h4></div></div></div></div></div><!-- end post -->';
                }

                if (i < 3 && p == 1 && $('#dato').attr('pagina-principal') == 1) {
                    
                    var lmas = '';

                    if(noti['leermas'] != ''){
                        lmas = '<div class="text-right pt-2"><a href="#' + noti['notkey'] + '" class="show-publicacion read-more" ><i class="fa fa-link"></i> Leer m&aacute;s</a></div>';
                    }

                    var carr_contnot = removeTags(noti['valcontnot']).substring(0, 273) + '...';

                    carr[k] = '<div class="wrapintro rounded my-0 pb-0 " img="' + noti['imgnot'] + '" style="height:240px;overflow:hidden;"><h1 style="margin-top:0px;font-size:2.5rem">' + noti['titulonot'] + '</h1><h2 style="margin-top:-2px;" class="lead text-justify wraper-pr m-0 p-0 pb-2">' + carr_contnot + lmas + '</h2></div>';

                    if (i == 0) {
                        img = noti['imgnot'];
                    }

                    k++;
                }

                i++;
            });

            if (p == 1 && $('#dato').attr('pagina-principal') == 1) {

                $('.carousel-item').remove();

                if (carr[0] != undefined) {
                    $('<div class="carousel-item active m-0 p-0">' + carr[0] + '</div>').appendTo('.carousel-inner');
                    $('<li data-target="#carousel" data-slide-to="0"></li>').appendTo('.carousel-indicators');
                    $('.intro').css({ 'background-image': 'url(' + img + ')' });
                }

                for (let j = 1; j < k; j++) {
                    $('<div class="carousel-item m-0 p-0">' + carr[j] + '</div>').appendTo('.carousel-inner');
                    $('<li data-target="#carousel" data-slide-to="' + j + '"></li>').appendTo('.carousel-indicators');

                }

                if (pnots != '') {
                    $('#novedades').html(pnots);
                    $('.featured-posts').show();
                }

                $('.intro').show();

            }

            if (nots != '' && $('#publicaciones').attr('posts-publicados') == 0) {

                nots += '<div class="mx-2 row col-12" ant="' + lnotkey[0] + '" sig="' + lnotkey[notis.length - 1] + '"><div class="col text-left"><a href="#publicaciones" class="paginacion-ant btn-primary btn"><i class="fa fa-caret-left" aria-hidden="true"></i> Siguientes</a></div><div class="col text-right"><a href="#publicaciones" class="paginacion-sig btn-primary btn">Anteriores <i class="fa fa-caret-right" aria-hidden="true"></i></a></div></div>';

                $('#publicaciones').html(nots);
                $('#publicaciones').attr('posts-publicados', 1);
                $('.recent-posts').show();
                $('#publicacion').hide();
                $('.publicaciones').show();

            }

        });

        $('.carousel').on('slide.bs.carousel', function (e) {
            var img = $(e.relatedTarget).find('.wrapintro').attr('img')

            if (img != undefined) {

                if (img.substring(0, 26) == 'https://youtube.com/embed/') {
                    img = 'assets/images/noticia.png';
                }

                $('.intro').css({ 'background-image': 'url(' + img + ')' });

            }


        });

    }

    function removeTags(str) {
        if ((str===null) || (str===''))
            return false;
        else
            str = str.toString();
              
        // Regular expression to identify HTML tags in 
        // the input string. Replacing the identified 
        // HTML tag with a null string.
        return str.replace( /(<([^>]+)>)/ig, '');
    }

    $(document).on('click', '.paginacion-sig', function () {
        var id = $(this).parent().parent().attr('sig');
        //alert(id);
        if (id != undefined) {
            VerPostMinis(firebase.database().ref('articulos').limitToFirst(4).endBefore(id), 4);
        } else {
            $(this).hide();
        }
    });

    $(document).on('click', '.paginacion-ant', function () {
        var id = $(this).parent().parent().attr('ant');
        if (id != undefined) {
            VerPostMinis(firebase.database().ref('articulos').limitToLast(4).endBefore(id), 4);
        } else {
            $(this).hide();
        }
    });

    $('.edicion').hide();

    setTimeout(function () {

        firebase.auth().onAuthStateChanged(userInfo => {

            if (userInfo) {

                const uid = userInfo.uid;
                const displayName = userInfo.displayName;
                const email = userInfo.email;
                const photoURL = userInfo.photoURL;
                const ue = window.btoa(EnCripto(email));
                
                firebase.database().ref('usuarios/' + uid + '/displayName').set(displayName);
                firebase.database().ref('usuarios/' + uid + '/email').set(email);
                firebase.database().ref('usuarios/' + uid + '/photoURL').set(photoURL);

                $('#entrar').parent().after('<li class="nav-item" id="salir"><a href="#a" class="nav-link title-pr" title="Cerrar Sesi&oacute;n" data-placement="bottom" tabindex="-1" data-content="Click para cerrar sesi&oacute;n" data-original-title="Cerrar Sesi&oacute;n"><i class="fa fa-sign-out" aria-hidden="true"></i> Salir</a></li>');

                $('#entrar').parent().html('<a id="userinfo" data-placement="bottom" tabindex="-1" href="#a" class="nav-link title-pr" title="' + displayName + '" data-content="Gracias por visitarnos" data-original-title="' + displayName + '"><img class="rounded-circle" style="margin-top:-12px;width:40px" src="' + photoURL + '" alt="' + displayName + '"></a>');

                $(document).on('click', '#salir', function () {
                    firebase.auth().signOut().then(() => { });
                    $('#salir').remove();
                    $('#userinfo').parent().html('<a href="#a" id="entrar" data-placement="bottom" tabindex="-1" class="nav-link title-pr" title="Entrar" data-content="Click para iniciar sesi&oacute;n con su cuenta de Google" data-original-title="Entrar"><i class="fa fa-key"></i> Entrar</a>');
                    $('.edicion').hide();
                    $('#comentando').hide();
                });



                $(document).on('click', '#mc-emoji-btn, #mc-cerrar-emojis', function () {
                    $('#mc-chat-emoticones').toggle('slow');
                });


                $(document).on('click', '#mc-mensaje-enviar', function () {


                    $('#comentar').trigger("click");

                })


                $(document).on('click', '.mc-mensaje-enviar', function () {


                    $('#responder').trigger("click");

                })


                $(document).on('keyup change', '#mc-mensaje-chat', function () {

                    var val = $(this).text();

                    if (val.length > 0) {
                        $('#mc-mensaje-enviar i').css("visibility", "visible");
                        if (event.ctrlKey || event.shiftKey) {
                            if (event.keyCode === 13) {
                                $('#keyenter').trigger("click");
                            }
                        } else if (event.keyCode === 13) {
                            $('#mc-mensaje-enviar').trigger("click");
                        }

                    } else {
                        $('#mc-mensaje-enviar i').css("visibility", "hidden");
                    }

                });

                const emo = document.querySelectorAll('.mc-emojic-click');
                emo.forEach(el => el.addEventListener('click', InsertarEmo));
                const keyenter = document.getElementById("keyenter");
                keyenter.addEventListener('click', InsertarEmo);


                function InsertarEmo(event, formato = '') {
                    var emoji = event.target.value;
                    const chatBox = document.getElementById("mc-mensaje-chat");
                    chatBox.focus();
                    ColocarEmoji(`${emoji}`);
                }


                function ColocarEmoji(html) {
                    let sel, range;
                    if (window.getSelection) {
                        sel = window.getSelection();
                        if (sel.getRangeAt && sel.rangeCount) {
                            range = sel.getRangeAt(0);
                            range.deleteContents();
                            const el = document.createElement("div");
                            el.innerHTML = html;
                            let frag = document.createDocumentFragment(), node, lastNode;
                            while ((node = el.firstChild)) {
                                lastNode = frag.appendChild(node);
                            }
                            range.insertNode(frag);

                            if (lastNode) {
                                range = range.cloneRange();
                                range.setStartAfter(lastNode);
                                range.collapse(true);
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                        }

                    } else if (document.selection && document.selection.type != "Control") {
                        document.selection.createRange().pasteHTML(html);
                    }
                }

                $(document).on("click", ".responder", function (e) {
                    e.preventDefault();
                    var idc = $(this).attr('idc');
                    $('#comentar').attr('id', 'responder');
                    $('#mc-mensaje-chat').focus();
                    $('#comentando label').text('Respuesta:');
                    $('#responder').attr('idc', idc);
                    $('#respondiendo').html($('#' + idc).html());
                    $('#respondiendo .responder').html('<span class="btn btn-sm btn-secondary" id="cancelar-respuesta">Cancelar</span>');
                    $('#respondiendo .responder').attr('class', 'responder-temporal');
                    $('#respondiendo .h' + idc).attr('class', 'd-none');

                });

                    $(document).on("keyup click", "#mc-mensaje-chat, .mc-emojic-click", function (e) {
                    //var com = $(this).html().replace(/[^aA0-zZ9ñÑáéíóúüÁÉÍÓÚÜ!@#$%&*()[\]\/{}\+.,"-\s~]/g,"");
                    var com = $('#mc-mensaje-chat').html();
                    com = com.substring(0, 600);
                    //$(this).html(com);
                    var n = 600 - Number(com.length);

                    $('#crts').text(n + ' caracteres')

                })

                
$(document).on("click", function(e) {
    e.stopPropagation();
    $('.chatformato').hide();
  });
  
  $(document).on('click', '#mc-mensaje-chat', function (e) {
  e.stopPropagation();
    var tar = e.target.getBoundingClientRect();
    $('.chatformato').show();
  });

  
$(function() {
    $('#formatobtn a').click(function(e) {
      document.execCommand($(this).data('role'), false, null);
    });
  });

                $(document).on("click", "#cancelar-respuesta", function (e) {
                    e.preventDefault();

                    $('#responder').attr('id', 'comentar');
                    $('#comentando label').text('Comentario:');
                    $('#comentar').removeAttr('idc');
                    $('#respondiendo').html('');
                    $('#respondiendo .responder-temporal').attr('class', 'responder');
                });

                $(document).on('click', '#comentar', function () {


                    var comentario_cont = $('#mc-mensaje-chat');

                    if (comentario_cont.text().length > 0) {

                        var comentario;
                        comentario = comentario_cont.html().trim();
                        comentario = comentario.replace(/\<br(.*?)\/?\>/gi, "\n");
                        comentario = comentario.replace(/<(?<=<)(.*?)(?=>)>/g, '');

                        comentario = comentario.split('\n');
                        comentario = comentario.filter(e => e);
                        comentario = comentario.join('\n');

                       
                        var idp = $(this).attr('idp');

                        if (comentario != '' &&  comentario.length > 3) {
                            
                            comentario = comentario.substring(0, 600);

                            firebase.database().ref('comentarios/' + idp).push({
                                fecha: firebase.database.ServerValue.TIMESTAMP,
                                comentario: comentario,
                                usuario: userInfo.uid
                            });

                            comentario_cont.text('');
                            $('#mc-mensaje-chat').focus();
                            $('#mc-chat-emoticones').hide('slow');

                        }
                    }

                });

                $(document).on('click', '#responder', function () {

                    var respuesta_cont = $('#mc-mensaje-chat');

                    if (respuesta_cont.text().length > 0) {

                        var respuesta;
                        respuesta = respuesta_cont.html().trim();
                        respuesta = respuesta.replace(/\<br(.*?)\/?\>/gi, "\n");
                        respuesta = respuesta.replace(/<(?<=<)(.*?)(?=>)>/g, '');

                        respuesta = respuesta.split('\n');
                        respuesta = respuesta.filter(e => e);
                        respuesta = respuesta.join('\n');

                        var idp = $(this).attr('idp');
                            var idc = $(this).attr('idc');

                        if (respuesta != '' && respuesta.length > 3 && idc != '' && idc.length > 3 && idp != '' && idp.length > 3) {

                            //".validate": "auth !== null && newData.child('usuario').val() === auth.uid && newData.child('comentario').isString() && newData.child('comentario').val().length > 3 && newData.child('comentario').val().length <= 600 && newData.child('fecha').val() <= now"
                            
                            respuesta = respuesta.substring(0, 600);
                           

                            firebase.database().ref('comentarios/' + idp + '/' + idc + '/respuestas').push({
                                fecha: firebase.database.ServerValue.TIMESTAMP,
                                respuesta: respuesta,
                                usuario: userInfo.uid
                            });
                            $('#cancelar-respuesta').trigger('click');
                            respuesta_cont.text('');
                            $('#' + idc + ' responder').focus();
    
                        }

                        
                    }

                });
                
                
                if ((ue == 'LnRyNG9XbnNhUWx3ZFJAZ2dNbWthMWlQbGouWWN1b09tbg==') && userInfo.email != '') {
                    
                    $('#formnov').html('<div class="text-center mx-5 px-5"><h2 class="section-title">Agregar noticia</h2><div class="form-group imgvid"><label for="imgnot">Foto de la noticia</label><br /><img src="assets/images/noticia.png" style="width:145px;height:97px" id="imgnot" class="rounded" /></div><div class="form-group vidimg" style="display:none"><label for="vidiframe">Video de la noticia</label><br /><div id="vidiframe"></div><div class="form-group"><label for="vidnot">Url del video</label><input type="text" class="form-control" id="vidnot" /></div></div><div> <input type="checkbox" value="1" style="width:25px;height:25px" id="uvideo" /> Usar video</div><div class="form-group"><label for="titulonot">T&iacute;tulo</label><input type="text" class="form-control" id="titulonot"></div><div class="form-group imgvid"><label for="fotonot">Cambiar foto </label><button type="button" class="btn btn-primary btn-sm border ml-3 galeria" data-toggle="modal" data-target="#galeria" id="fotonot">Galer&iacute;a</button></div><div class="form-group"><label for="contnot">Contenido</label><textarea class="form-control h-100" id="contnot" rows="7"></textarea></div><div class="form-group"><label for="tagsnot">Etiquetas</label><input type="text" class="form-control" id="tagsnot"></div><div class="text-right"><button type="button" class="btn btn-primary" id="nuevanot">Publicar</button><div class="text-center">Activo: <input value="1" type="checkbox" class="activonot form-control" id="activonot" /></div></div></div>');
                    

                    $("#foto_cargar").change(function () {

                        $('#barrafoto').text('');
                        $('#subiendofoto').text('');
                        $('#barrafoto').show();
                        $('#subiendofoto').show();

                        var file = this.files[0];
                        var filess = this.files;

                        (function () {
                            if (window.performance && window.performance.now) return;
                            if (!window.performance) window.performance = {};
                            var methods = ['webkitNow', 'msNow', 'mozNow'];
                            for (var i = 0; i < methods.length; i++) {
                                if (window.performance[methods[i]]) {
                                    window.performance.now = window.performance[methods[i]];
                                    return;
                                }
                            }
                            if (Date.now) {
                                window.performance.now = function () { return Date.now(); };
                                return;
                            }
                            window.performance.now = function () { return +(new Date()); };
                        })();

                        window.pica.prototype.debug = console.log.bind(console);

                        var resizer;

                        var resizer_mode = {
                            js: true,
                            wasm: true,
                            cib: true,
                            ww: true
                        };


                        function create_resizer() {
                            var opts = [];

                            Object.keys(resizer_mode).forEach(function (k) {
                                if (resizer_mode[k]) opts.push(k);
                            });

                            resizer = window.pica({ features: opts });
                        }

                        function canvaFoto() {
                            var src, ctx;

                            src = $('#foto_canvas')[0];
                            src.width = img.width;
                            src.height = img.height;

                            ctx = src.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                        }

                        var RedimensionarFoto = _.debounce(function () {
                            var dst, ctx, width;

                            var w = $('#ancho').val();
                            var h = $('#alto').val();
                            if (w == 0) {
                                w = img.width;
                            }
                            if (h == 0) {
                                h = img.height;
                            }
                            dst = $('#foto_canvas_mini')[0];
                            dst.width = w;
                            dst.height = h;

                            var offScreenCanvas = document.createElement('canvas')
                            offScreenCanvas.width = dst.width;
                            offScreenCanvas.height = dst.height;

                            resizer.resize($('#foto_canvas')[0], offScreenCanvas, {
                                quality: quality,
                                alpha: alpha,
                                unsharpAmount: unsharpAmount,
                                unsharpRadius: unsharpRadius,
                                unsharpThreshold: unsharpThreshold,
                                transferable: true
                            })
                                .then(function () {

                                    dst.getContext('2d', { alpha: Boolean(alpha) }).drawImage(offScreenCanvas, 0, 0);

                                    var imgtype = file.type;
                                    var foto = 'fotos/' + file.name;

                                    var dataurl = offScreenCanvas.toDataURL(imgtype, 1.0);

                                    var subirimagen = firebase.storage().ref().child(foto).putString(dataurl, 'data_url');

                                    subirimagen.on(firebase.storage.TaskEvent.STATE_CHANGED,
                                        function (snapshot) {

                                            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                            var progress = Math.round(progress);
                                            $('#barrafoto').html('<div class="progress-bar rounded progress-bar-striped d-block bg-info progress-bar-animated" role="progressbar" style="width: ' + progress + '%;font-weight:bold;font-size:15pt" aria-valuenow="' + progress + '" aria-valuemin="0" aria-valuemax="100">' + progress + '%</div>');
                                            switch (snapshot.state) {
                                                case firebase.storage.TaskState.PAUSED:
                                                    console.log('Pausar subida');
                                                    break;
                                                case firebase.storage.TaskState.RUNNING:
                                                    $('#subiendofoto').text('Subiendo imagen: ');
                                                    break;
                                            }
                                        }, function (error) {


                                            switch (error.code) {
                                                case 'storage/unauthorized':
                                                    $('#subiendofoto').html('<div class="text-danger">No se pudo cargar la imagen, intente de nuevo</div>');
                                                    break;
                                                case 'storage/canceled':
                                                    $('#subiendofoto').html('<div class="text-danger">No se pudo cargar la imagen, intente de nuevo</div>');
                                                    break;

                                                case 'storage/unknown':
                                                    $('#subiendofoto').html('<div class="text-danger">No se pudo cargar la imagen, intente de nuevo</div>');
                                                    break;
                                            }
                                        }, function () {

                                            subirimagen.snapshot.ref.getDownloadURL().then(function (urlfoto) {

                                                // urlfoto

                                                $('#subiendofoto').html('<div class="text-success">&iexcl;La imagen se ha subido con &eacute;xito!</div>');
                                                $('.galeria').trigger('reload');

                                                setTimeout(function () {
                                                    $('#barrafoto').hide('slow');
                                                    $('#subiendofoto').hide('slow');
                                                }, 5000);

                                            });

                                        });


                                })

                        }, 100);


                        var img = new Image();

                        var quality = 3;
                        var unsharpAmount = 80;
                        var unsharpRadius = 0.6;
                        var unsharpThreshold = 2;
                        var alpha = true;

                        resizer_mode.ww = true;
                        resizer_mode.cib = false;
                        resizer_mode.wasm = true;

                        create_resizer();

                        var files = $(this)[0].files;

                        img.src = window.URL.createObjectURL(files[0]);
                        $('#foto_mini').css('background-image', 'url(' + img.src + ')');
                        $('#foto_mini').hide();
                        $('#foto_mini').fadeIn(650);
                        img.onload = function () {
                            canvaFoto();
                            RedimensionarFoto();
                        };


                    });

                    $(document).on('click', '.elnot', function () {

                        if (!confirm("\u00BFSeguro desea eliminar esta noticia?")) {
                            return false;
                        }

                        var idp = $(this).attr('idp');

                        if (idp != '' && idp != null && idp != undefined) {
                            firebase.database().ref('articulos/' + idp).remove();
                            $('.show-principal').trigger('click');
                        }

                    });

                    $(document).on('click', '.elresp', function () {

                        if (!confirm("\u00BFSeguro desea eliminar esta respuesta?")) {
                            return false;
                        }

                        var idr = $(this).attr('idr');
                        var idc = $(this).attr('idc');
                        var idp = $(this).attr('idp');

                        if (idp != null && idp != '' && idp != undefined && idc != null && idc != '' && idc != undefined && idr != '' && idr != null && idr != undefined) {
                            firebase.database().ref('comentarios/' + idp + '/' + idc + '/respuestas/' + idr).remove();

                        }

                    });


                    $(document).on('click', '.elcom', function () {

                        if (!confirm("\u00BFSeguro desea eliminar este comentario y TODAS sus respuestas?")) {
                            return false;
                        }

                        var idc = $(this).attr('idc');
                        var idp = $(this).attr('idp');

                        if (idp != '' && idp != null && idp != undefined && idc != null && idc != '' && idc != undefined) {
                            firebase.database().ref('comentarios/' + idp + '/' + idc).remove();
                        }

                    });

                    $(document).on('click', '.infoto', function () {

                        var src = $(this).attr('src');

                        $('#imgnot').attr('src', src);

                    });


                    $(document).on('click reload', '.galeria', function () {

                        $('#fotos-galeria').text('');

                        var storageRef = firebase.storage().ref("fotos");
                        storageRef.listAll().then(function (result) {
                            var urls = '';
                            result.items.forEach(function (imageRef) {
                                imageRef.getDownloadURL().then(function (url) {
                                    urls += '<div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 mb-2 title-farmacia" data-dismiss="modal" data-content="Click para insertar ' + imageRef.name + '"><img class="img rounded infoto" alt="Foto" src="' + url + '" /></div>';
                                    $('#fotos-galeria').html(urls);
                                })
                            });

                        })
                    });

                    $(document).on('keyup click', '#vidnot', function () {

                        var uvideo = $(this).val();
                        var avid = $('#vidiframe').attr('vid');

                        if (uvideo != '') {
                            if (uvideo != avid) {
                                $('#vidiframe').html('Espere...');
                                $('#vidiframe').attr('vid', uvideo);
                                var uvideo = uvideo.replace('youtu.be/', 'youtube.com/embed/');
                                var uvideo = uvideo.replace('youtube.com/watch?v=', 'youtube.com/embed/');
                                if (uvideo.substring(0, 30) == 'https://www.youtube.com/embed/' || uvideo.substring(0, 26) == 'https://youtube.com/embed/') {
                                    $('#vidiframe').html('<iframe width="245" height="auto" src="' + uvideo + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
                                } else {
                                    $('#vidiframe').html('<span class="text-danger">Url no v&aacute;lida</div>');
                                }

                            }
                        } else {
                            $('#vidiframe').text('');
                            $('#vidiframe').attr('vid', '');
                        }
                    });

                    $(document).on('click', '#uvideo', function () {
                        if ($(this).prop("checked") == true) {
                            $('.imgvid').hide('slow');
                            $('.vidimg').show('slow');
                        } else {
                            $('#vidiframe').text('');
                            $('#vidiframe').attr('vid', '');
                            $('.vidimg').hide('slow');
                            $('.imgvid').show('slow');
                        }
                    });

                    $(document).on('click', '#nuevanot', function () {

                        var titulonot = $('#titulonot').val();
                        var contnot = $('#contnot').val();
                        var tagsnot = $('#tagsnot').val();

                        if ($('#activonot').prop("checked") == true) {
                            var activonot = 1;
                        } else {
                            var activonot = 0;
                        }

                        if (titulonot != '' && contnot != '') {

                            var vidnot = $('#vidnot').val().replace('youtu.be/', 'youtube.com/embed/');
                            var vidnot = vidnot.replace('youtube.com/watch?v=', 'youtube.com/embed/');
                            var vidnot = vidnot.replace('https://www.youtube.com', 'https://youtube.com');

                            if (vidnot.substring(0, 26) == 'https://youtube.com/embed/' && $('#uvideo').prop("checked") == true) {
                                var imgnot = vidnot;
                            } else {
                                var imgnot = $('#imgnot').attr('src');
                            }

                            firebase.database().ref('articulos').push({
                                fecha: firebase.database.ServerValue.TIMESTAMP,
                                titulo: titulonot,
                                imagen: imgnot,
                                contenido: contnot,
                                categorias: tagsnot,
                                activo: activonot
                            });

                            $('#titulonot').val('');
                            $('#imgnot').attr('src', 'assets/images/noticia.png');
                            $('#vidnot').val('');
                            $('#vidiframe').text('');
                            $('#contnot').val('');
                            $('#tagsnot').val('');

                        }

                    });

                    $(document).on('click', '#viejanot', function (e) {
                        e.stopPropagation();
                        var idp = $(this).attr('idp');
                        var til = $('#titulonot').val();
                        if ($('#activonot').prop("checked") == true) {
                            var activonot = 1;
                        } else {
                            var activonot = 0;
                        }
                        
                        firebase.database().ref('articulos/' + idp + '/titulo').set(til);
                        firebase.database().ref('articulos/' + idp + '/imagen').set($('#imgnot').attr('src'));
                        firebase.database().ref('articulos/' + idp + '/titulo').set($('#titulonot').val());
                        firebase.database().ref('articulos/' + idp + '/contenido').set($('#contnot').val());
                        firebase.database().ref('articulos/' + idp + '/categorias').set($('#tagsnot').val());
                        firebase.database().ref('articulos/' + idp + '/activo').set(activonot);

                        $('#titulonot').val('');
                        $('#imgnot').attr('src', 'assets/images/noticia.png');
                        $('#vidnot').val('');
                        $('#vidiframe').text('');
                        $('#contnot').val('');
                        $('#tagsnot').val('');
                        $('#viejanot').attr('id', 'nuevanot');

                        window.location.href = '?post=' + `${encodeURIComponent(til)}` + '&pid=' + EnCripto(idp);

                    });

                    $(document).on('click', '#editar-post', function () {

                        $('#formnov').show();
                        var nov = $(this).closest('#publicacion');
                        if ($('#video-fixed').length > 0) {
                            $('#vidnot').val($('#video-fixed').attr('src'));
                            $('#uvideo').trigger("click");
                            $('#vidnot').trigger("click");
                        } else {
                            $('#imgnot').attr('src', nov.find('.featured-image').attr('src'));
                        }

                        $('#titulonot').val(nov.find('.posttitle').text());
                        $('#contnot').val(nov.find('.article-post span').html());
                        $('#tagsnot').val(nov.find('.tags-cats').val());
                        $('#nuevanot').attr('id', 'viejanot');
                        $('#viejanot').attr('idp', $(this).attr('idp'));

                        $('#activonot').prop("checked", false);
                        
                        if (nov.find('.activonot').val() == 1) {
                            $('#activonot').prop("checked", true);
                        } 

                    });

                    $(document).on('click', '.ehtml', function () {

                        var ruta = $(this).attr('ruta');

                        if (ruta != '' && ruta != undefined) {

                            $('#data-info').attr('ruta', ruta);

                            firebase.database().ref(ruta).on('value', function (dat) {
                                if (dat.val() != null) {
                                    $('#data-info').val(dat.val());
                                }
                            });
                        }
                    });

                    $(document).on('click', '#data-info', function (e) {
                        e.stopPropagation();
                    });

                    $(document).on('blur', '#data-info', function () {

                        var ruta = $(this).attr('ruta');
                        var val = $(this).val();

                        if (val != '' && val != undefined && ruta != '' && ruta != undefined) {
                            firebase.database().ref(ruta).set(val);
                        }

                    });


                
                    setTimeout(function () {

                        $('.edicion').show();

                    }, 10000);


                    $(document).on("click", ".show-publicacion-na", function (e) {
                        e.preventDefault();
                        var id = $(this).attr('href').split('#')[1];
                        VerPost(id, $('#dato').attr('video' + id), 1);
                
                    });


                    $(document).on("click", "#show-noticia", function (e) {
                        e.preventDefault();
                
                        $('#formnov').toggle();
                
                  
                    firebase.database().ref('articulos').on('value', function (noactivas) {
                        
                        var artsna = '';
                        var n = 1;

                        noactivas.forEach(function (na) {

                        if(na.val().activo == 0){
                                                      
                        var fecha = na.val().fecha
                        var date = new Date(fecha);
        
                        var fechanot = date.getDate() + ' ' + meses[date.getMonth()];
                        
                        artsna += '<div class="ml-3"><h2>'+n+' - <a href="#'+na.key+'" class="show-publicacion-na">'+na.val().titulo+'</a></h2> - '+fechanot+'</div>';
                       
                    }

                   
                    n++;

                    })

                    $('#artsna').html(artsna);


                })


            });
          


                }

            }

        });


    }, 500);


    $('body').popover({
        selector: '.title-pr',
        trigger: 'hover'
    });

    function Sesion() {

        const provider = new firebase.auth.GoogleAuthProvider();
        //provider.addScope('profile'); signInWithRedirect signInWithPopup
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function () {
            return firebase.auth().signInWithRedirect(provider).then(() => {
            })
                .catch(err => {
                    setTimeout(function () {
                        $('#sesion').html('<span class="font-weight-bold text-danger p-2 rounded">&iexcl;Ha ocurrido un error!</span>');
                    }, 500);
                    setTimeout(function () {
                        $('#sesion').text('Intentando de nuevo...');
                    }, 5000);
                    setTimeout(function () {
                        Sesion();
                    }, 7000);
                }); 
        });

    }

    setTimeout(function () {
        $('#versiculo-dia').html($('.bibleVerse a').html());
    }, 1000);

    var f = new Date();
    var a = f.getFullYear();
    document.getElementById("copy").innerHTML = '&copy; ' + a + ' SaaS Dominicana';

});