/* ============================================================
   ProductsX Open — 原生 JavaScript, 无任何依赖
   数据来源: ProductsX 公开 API (https://productsx.app)
   功能: 主题切换 / 产品瀑布流 / 供应商目录 / 无限滚动
   ============================================================ */

(function () {
    'use strict';

    // ─── 配置 ──────────────────────────────────────────
    var API_BASE = 'https://productsx.app';

    // ─── 工具 ──────────────────────────────────────────
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function fetchJson(url) {
        return fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            });
    }

    // ─── 主题切换 ──────────────────────────────────────
    (function initTheme() {
        var saved = null;
        try { saved = localStorage.getItem('px-theme'); } catch (e) {}
        var dark = saved ? saved === 'dark'
            : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('theme-dark', dark);

        var btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', function () {
                var next = !document.documentElement.classList.contains('theme-dark');
                document.documentElement.classList.toggle('theme-dark', next);
                try { localStorage.setItem('px-theme', next ? 'dark' : 'light'); } catch (e) {}
            });
        }
    })();

    // ─── 通用: 渠道徽章文本 ────────────────────────────
    function channelText(chArr) {
        if (!Array.isArray(chArr) || chArr.length === 0) return '';
        var first = chArr[0];
        var name = (first && (first.name || first.channel)) || '';
        return name ? String(name) : '';
    }

    // ─── 产品卡片模板 ──────────────────────────────────
    // 整卡可点击 → 打开右侧分屏详情 (同主站);
    // 仅供应商名是外链, 点击跳转主站供应商页
    function renderCard(p) {
        var img = Array.isArray(p.images) && p.images.length ? p.images[0] : '';
        var mediaInner = img
            ? '<img src="' + esc(img) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async">'
            : '<span class="card-media-empty">' +
              '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
              '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
              '<path d="M21 15l-5-5L5 21"/></svg></span>';

        var videoBadge = p.mediaType === 2
            ? '<span class="card-badge card-badge-video">' +
              '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>Video</span>'
            : '';

        var price = p.specs && p.specs.price && p.specs.price !== '-' ? p.specs.price : '';
        var priceBadge = price
            ? '<span class="card-badge card-badge-price">' + esc(price) + '</span>'
            : '';

        // 悬浮操作条: 点赞/收藏/评论计数 (展示; 互动在主站完成)
        var hoverBar =
            '<div class="card-hover-bar">' +
                '<span class="card-stat" title="Likes">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                    (p.like_count || 0) +
                '</span>' +
                '<span class="card-stat" title="Favorites">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
                    (p.fav_count || 0) +
                '</span>' +
                '<span class="card-stat" title="Comments">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
                    (p.comment_count || 0) +
                '</span>' +
            '</div>';

        // 角标与悬浮条都锚定在 .card-media (position: relative) 内
        var media = '<div class="card-media">' + mediaInner + videoBadge + priceBadge + hoverBar + '</div>';

        var supplierInner =
            (p.supplier_logo
                ? '<span class="supplier-avatar"><img src="' + esc(p.supplier_logo) + '" alt="" loading="lazy" width="24" height="24"></span>'
                : '<span class="supplier-avatar">' + esc(p.initials) + '</span>') +
            '<span class="supplier-name">' + esc(p.supplier_name) + '</span>';

        var supplier = p.supplier_guid
            ? '<a class="card-supplier" href="' + API_BASE + '/supplier/' + encodeURIComponent(p.supplier_guid) +
              '" target="_blank" rel="noopener">' + supplierInner + '</a>'
            : '<div class="card-supplier">' + supplierInner + '</div>';

        var ch = channelText(p.channel);
        var footer =
            '<div class="card-footer">' +
                (ch ? '<span class="card-channel">' + esc(ch) + '</span>' : '<span></span>') +
                '<span class="post-time">' + esc(p.time_ago) + '</span>' +
            '</div>';

        return '<article class="product-card" data-guid="' + encodeURIComponent(p.guid) + '">' +
            media +
            '<div class="card-body">' +
                '<h3 class="product-title">' + esc(p.title) + '</h3>' +
                supplier + footer +
            '</div>' +
        '</article>';
    }

    // ─── Matrix 表格行模板 (参考主站首页 Matrix 视图) ──
    function renderMatrixRow(p) {
        var specs = p.specs || {};
        var val = function (v) { return v && v !== '-' ? esc(v) : '-'; };
        var supplierCell = p.supplier_guid
            ? '<a href="' + API_BASE + '/supplier/' + encodeURIComponent(p.supplier_guid) +
              '" target="_blank" rel="noopener" class="matrix-supplier-link">' + esc(p.supplier_name) + '</a>'
            : esc(p.supplier_name);
        var ch = channelText(p.channel);

        return '<div class="matrix-grid matrix-grid-row" data-guid="' + encodeURIComponent(p.guid) + '">' +
            '<div class="matrix-cell matrix-col-title">' +
                '<a href="' + API_BASE + '/p/' + encodeURIComponent(p.guid) + '" target="_blank" rel="noopener" class="matrix-title-link">' + esc(p.title) + '</a>' +
            '</div>' +
            '<div class="matrix-cell matrix-col-supplier">' + supplierCell + '</div>' +
            '<div class="matrix-cell matrix-col-price"><span class="matrix-price">' + val(specs.price) + '</span></div>' +
            '<div class="matrix-cell matrix-col-moq">' + val(specs.moq) + '</div>' +
            '<div class="matrix-cell matrix-col-certs">' + val(specs.certs) + '</div>' +
            '<div class="matrix-cell matrix-col-lead">' + val(specs.lead) + '</div>' +
            '<div class="matrix-cell matrix-col-channel"><div class="matrix-channel">' + esc(ch || '-') + '</div></div>' +
            '<div class="matrix-cell matrix-col-posted">' + esc(p.time_ago) + '</div>' +
        '</div>';
    }

    // ─── 右侧分屏详情面板 (Google Images style) ────────
    // 数据来自 /api/posts 卡片自身字段, 无需额外请求;
    // 评论/互动跳转主站详情页
    var detailEl = {
        panel: null, body: null, title: null, close: null, current: null
    };

    function initDetailPanel() {
        detailEl.panel = document.getElementById('detailPanel');
        detailEl.body = document.getElementById('detailBody');
        detailEl.title = document.getElementById('detailTitle');
        detailEl.close = document.getElementById('detailClose');
        if (!detailEl.panel) return;

        detailEl.close.addEventListener('click', closeDetailPanel);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && detailEl.panel.classList.contains('open')) closeDetailPanel();
        });
    }

    function openDetailPanel(p, card) {
        if (!detailEl.panel) return;

        // 高亮当前卡片, 迁移旧高亮
        var prev = document.querySelector('.product-card.selected');
        if (prev) prev.classList.remove('selected');
        if (card) card.classList.add('selected');

        // ── 媒体区: 多图轮播 / 单图 / 无图占位 (同主站 drawer) ──
        var imgs = Array.isArray(p.images) ? p.images : [];
        var mediaHtml;
        if (imgs.length > 1) {
            mediaHtml = '<div class="detail-carousel">' +
                '<div class="carousel-track">' +
                    imgs.map(function (src, i) {
                        return '<img src="' + esc(src) + '" alt="Product image ' + (i + 1) + '"' +
                               (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
                    }).join('') +
                '</div>' +
                '<button type="button" class="carousel-arrow prev" data-dir="-1" aria-label="Previous image">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>' +
                '</button>' +
                '<button type="button" class="carousel-arrow next" data-dir="1" aria-label="Next image">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' +
                '</button>' +
                '<div class="carousel-dots">' +
                    imgs.map(function (_, i) {
                        return '<span class="carousel-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '" role="button" aria-label="Go to image ' + (i + 1) + '"></span>';
                    }).join('') +
                '</div>' +
            '</div>';
        } else if (imgs.length === 1) {
            mediaHtml = '<div class="detail-media"><img src="' + esc(imgs[0]) + '" alt="' + esc(p.title) + '"></div>';
        } else {
            mediaHtml = '<div class="detail-media"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
              '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
              '<path d="M21 15l-5-5L5 21"/></svg></div>';
        }

        // 规格四宫格: Price / MOQ / Lead / Certs
        var specs = p.specs || {};
        var specBoxes = [
            ['Price', specs.price], ['MOQ', specs.moq],
            ['Lead Time', specs.lead], ['Certifications', specs.certs]
        ].filter(function (kv) { return kv[1] && kv[1] !== '-'; })
         .map(function (kv) {
             return '<div class="spec-box"><span class="k">' + esc(kv[0]) + '</span>' +
                    '<span class="v">' + esc(kv[1]) + '</span></div>';
         }).join('');
        var specHtml = specBoxes
            ? '<h3 class="detail-section-title">Specifications</h3><div class="spec-grid">' + specBoxes + '</div>'
            : '';

        // 扩展参数列表 (details: [label, value] 数组)
        var detailRows = (Array.isArray(p.details) ? p.details : []).map(function (row) {
            if (!Array.isArray(row) || !row[1] || row[1] === '-') return '';
            return '<div class="spec-box"><span class="k">' + esc(row[0]) + '</span>' +
                   '<span class="v">' + esc(row[1]) + '</span></div>';
        }).join('');
        var detailHtml = detailRows
            ? '<h3 class="detail-section-title">Details</h3><div class="spec-grid">' + detailRows + '</div>'
            : '';

        var desc = p.content ? '<h3 class="detail-section-title">Description</h3>' +
            '<p class="detail-desc">' + esc(p.content) + '</p>' : '';

        var tags = (Array.isArray(p.tags) ? p.tags : []).map(function (t) {
            var name = typeof t === 'string' ? t : t.name;
            var slug = typeof t === 'string' ? '' : t.slug;
            return slug
                ? '<a class="tag-pill" href="' + API_BASE + '/tag/' + encodeURIComponent(slug) + '" target="_blank" rel="noopener">' + esc(name) + '</a>'
                : '<span class="tag-pill">' + esc(name) + '</span>';
        }).join('');
        var tagsHtml = tags ? '<h3 class="detail-section-title">Tags</h3><div class="detail-tags">' + tags + '</div>' : '';

        var supplierInner =
            (p.supplier_logo
                ? '<span class="supplier-avatar"><img src="' + esc(p.supplier_logo) + '" alt="" width="24" height="24"></span>'
                : '<span class="supplier-avatar">' + esc(p.initials) + '</span>') +
            '<span class="supplier-name">' + esc(p.supplier_name) + '</span>';
        var supplierHtml = p.supplier_guid
            ? '<a class="detail-supplier" href="' + API_BASE + '/supplier/' + encodeURIComponent(p.supplier_guid) +
              '" target="_blank" rel="noopener">' + supplierInner + '</a>'
            : '<div class="detail-supplier">' + supplierInner + '</div>';

        var postUrl = API_BASE + '/p/' + encodeURIComponent(p.guid);
        detailEl.title.textContent = p.title;
        detailEl.body.innerHTML =
            mediaHtml + specHtml + detailHtml + desc + tagsHtml + supplierHtml +
            // 互动计数 (展示) + 公开评论流; 点赞/收藏/评论在主站完成
            '<div class="detail-actions">' +
                '<a class="detail-action" href="' + postUrl + '" target="_blank" rel="noopener">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                    (p.like_count || 0) +
                '</a>' +
                '<a class="detail-action" href="' + postUrl + '" target="_blank" rel="noopener">' +
                    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
                    (p.fav_count || 0) +
                '</a>' +
            '</div>' +
            '<h3 class="detail-section-title">Comments</h3>' +
            '<div id="detailComments" class="comment-loading">Loading comments…</div>' +
            '<a class="detail-cta" href="' + postUrl + '" target="_blank" rel="noopener">' +
                'View full details &amp; contact supplier' +
                '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
                '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
            '</a>';

        detailEl.panel.hidden = false;
        // 触发一次 reflow 保证过渡动画生效
        void detailEl.panel.offsetWidth;
        detailEl.panel.classList.add('open');
        document.getElementById('detailOverlay').hidden = false;
        document.body.classList.add('detail-open');
        detailEl.current = p.guid;
        detailEl.body.scrollTop = 0;

        bindCarousel();
        loadComments(p);
    }

    // ─── 轮播交互: 箭头 / 圆点 / 触屏滑动 (每次渲染后重新绑定) ──
    var detailSlide = 0;

    function bindCarousel() {
        var carousel = detailEl.body.querySelector('.detail-carousel');
        if (!carousel) return;

        var track = carousel.querySelector('.carousel-track');
        var total = track.children.length;
        detailSlide = 0;

        function update() {
            track.style.transform = 'translateX(-' + (detailSlide * 100) + '%)';
            var dots = carousel.querySelectorAll('.carousel-dot');
            for (var i = 0; i < dots.length; i++) {
                dots[i].classList.toggle('active', i === detailSlide);
            }
        }

        function changeSlide(dir) {
            detailSlide = Math.max(0, Math.min(total - 1, detailSlide + dir));
            update();
        }

        var arrows = carousel.querySelectorAll('.carousel-arrow');
        for (var a = 0; a < arrows.length; a++) {
            arrows[a].addEventListener('click', function (e) {
                e.stopPropagation();
                changeSlide(parseInt(this.getAttribute('data-dir'), 10) || 0);
            });
        }

        var dots = carousel.querySelectorAll('.carousel-dot');
        for (var d = 0; d < dots.length; d++) {
            dots[d].addEventListener('click', function (e) {
                e.stopPropagation();
                detailSlide = parseInt(this.getAttribute('data-slide'), 10) || 0;
                update();
            });
        }

        // 触屏滑动切换
        var touchX = null;
        carousel.addEventListener('touchstart', function (e) {
            touchX = e.touches[0].clientX;
        }, { passive: true });
        carousel.addEventListener('touchend', function (e) {
            if (touchX === null) return;
            var dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 40) changeSlide(dx < 0 ? 1 : -1);
            touchX = null;
        }, { passive: true });

        update();
    }

    // ─── 公开评论流: GET /api/post/{id}/comments ──────
    function renderCommentItem(c) {
        var avatar = c.user_avatar
            ? '<span class="comment-avatar"><img src="' + esc(c.user_avatar) + '" alt="" loading="lazy"></span>'
            : '<span class="comment-avatar">' + esc((c.user_name || '?').charAt(0).toUpperCase()) + '</span>';
        var company = c.company_name ? '<span class="comment-company"> · ' + esc(c.company_name) + '</span>' : '';

        var replies = (c.replies || []).map(renderCommentItem).join('');

        return '<div class="comment-item">' + avatar +
            '<div class="comment-main">' +
                '<div class="comment-author">' + esc(c.user_name) + company + '</div>' +
                '<div class="comment-text">' + esc(c.content) + '</div>' +
                (replies ? '<div class="comment-replies">' + replies + '</div>' : '') +
            '</div>' +
        '</div>';
    }

    function loadComments(p) {
        var box = document.getElementById('detailComments');
        if (!box) return;

        fetchJson(API_BASE + '/api/post/' + encodeURIComponent(p.id) + '/comments')
            .then(function (res) {
                if (detailEl.current !== String(p.guid)) return; // 已切换到其他产品
                var list = (res && res.data && res.data.list) || [];
                if (!list.length) {
                    box.className = 'comment-empty';
                    box.textContent = 'No comments yet. Join the discussion on ProductsX.app.';
                    return;
                }
                box.className = '';
                box.innerHTML = list.map(renderCommentItem).join('');
            })
            .catch(function () {
                if (detailEl.current !== String(p.guid)) return;
                box.className = 'comment-empty';
                box.textContent = 'Comments unavailable.';
            });
    }

    function closeDetailPanel() {
        if (!detailEl.panel || !detailEl.panel.classList.contains('open')) return;
        detailEl.panel.classList.remove('open');
        document.body.classList.remove('detail-open');
        var prev = document.querySelector('.product-card.selected');
        if (prev) prev.classList.remove('selected');
        detailEl.current = null;
        // 等滑出动画结束后再隐藏
        setTimeout(function () {
            if (!detailEl.panel.classList.contains('open')) {
                detailEl.panel.hidden = true;
                document.getElementById('detailOverlay').hidden = true;
            }
        }, 300);
    }

    // ─── 供应商卡片模板 ────────────────────────────────
    function renderSupplierCard(c) {
        var avatar = c.logo_url
            ? '<span class="supplier-card-avatar"><img src="' + esc(c.logo_url) + '" alt="" loading="lazy" width="44" height="44"></span>'
            : '<span class="supplier-card-avatar">' + esc(c.initials) + '</span>';

        var loc = [c.country, c.province, c.city].filter(Boolean).join(', ');
        var year = c.established_year ? 'Est. ' + c.established_year : '';

        var tags = (c.tags || []).slice(0, 4).map(function (t) {
            var name = typeof t === 'string' ? t : t.name;
            var slug = typeof t === 'string' ? '' : t.slug;
            return slug
                ? '<a class="tag-pill" href="' + API_BASE + '/tag/' + encodeURIComponent(slug) + '" target="_blank" rel="noopener">' + esc(name) + '</a>'
                : '<span class="tag-pill">' + esc(name) + '</span>';
        }).join('');

        return '<a class="supplier-card" href="' + API_BASE + '/supplier/' + encodeURIComponent(c.guid) +
            '" target="_blank" rel="noopener">' +
            '<div class="supplier-card-head">' + avatar +
                '<span class="supplier-card-name">' + esc(c.name) + '</span>' +
            '</div>' +
            (c.verified === 1
                ? '<span class="verified-badge"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
                  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Verified</span>'
                : '') +
            '<div class="supplier-card-meta">' +
                (loc ? '<span>' + esc(loc) + '</span>' : '') +
                (year ? '<span>' + esc(year) + '</span>' : '') +
                '<span>' + c.post_count + ' products</span>' +
            '</div>' +
            (tags ? '<div class="supplier-card-tags">' + tags + '</div>' : '') +
        '</a>';
    }

    // ─── 无限滚动加载器 ────────────────────────────────
    function createFeedLoader(opts) {
        var container = document.getElementById(opts.containerId);
        var statusEl = document.getElementById(opts.statusId);
        if (!container || !statusEl) return;

        var page = 0;
        var loading = false;
        var hasMore = true;
        var sentinel = null;
        var retryBtnAdded = false;
        var itemsByGuid = {};
        var matrixContainer = opts.matrixContainerId ? document.getElementById(opts.matrixContainerId) : null;

        // 卡片点击 → 右侧分屏详情 (供应商外链除外, 其余整卡可点, 同主站)
        if (opts.onCardClick) {
            container.addEventListener('click', function (e) {
                if (e.target.closest('a.card-supplier')) return;
                var card = e.target.closest('.product-card');
                if (!card) return;
                var post = itemsByGuid[card.getAttribute('data-guid')];
                if (post) opts.onCardClick(post, card);
            });
        }

        // Matrix 行点击 → 右侧分屏详情 (同主站行为)
        if (opts.onMatrixClick && matrixContainer) {
            matrixContainer.addEventListener('click', function (e) {
                if (e.target.closest('a')) return;
                var row = e.target.closest('.matrix-grid-row');
                if (!row) return;
                var post = itemsByGuid[row.getAttribute('data-guid')];
                if (post) opts.onMatrixClick(post, row);
            });
        }

        function setStatus(text, isError) {
            statusEl.textContent = text;
            statusEl.classList.toggle('error', !!isError);
            statusEl.hidden = !text;
        }

        function setStatusHtml(html, isError) {
            statusEl.innerHTML = html;
            statusEl.classList.toggle('error', !!isError);
            statusEl.hidden = !html;
        }

        function buildUrl() {
            return API_BASE + opts.endpoint + '?page=' + (page + 1);
        }

        var sentinelVisible = false;

        function loadMore() {
            if (loading || !hasMore) return;
            loading = true;
            setStatus('Loading…', false);

            fetchJson(buildUrl())
                .then(function (res) {
                    var data = res && res.data ? res.data : {};
                    var list = data.list || [];
                    page += 1;
                    hasMore = !!data.has_more;

                    if (list.length) {
                        var html = '';
                        var mhtml = '';
                        for (var i = 0; i < list.length; i++) {
                            if (list[i] && list[i].guid) itemsByGuid[String(list[i].guid)] = list[i];
                            html += opts.render(list[i]);
                            if (matrixContainer && opts.renderMatrix) mhtml += opts.renderMatrix(list[i]);
                        }
                        container.insertAdjacentHTML('beforeend', html);
                        if (mhtml) matrixContainer.insertAdjacentHTML('beforeend', mhtml);
                        if (opts.onPageLoaded) opts.onPageLoaded(page);
                        if (!hasMore) {
                            setStatusHtml('You have reached the end. View more on ' +
                                '<a href="' + API_BASE + '" target="_blank" rel="noopener">ProductsX.app</a>', false);
                            disconnect();
                            loading = false;
                            return;
                        }
                        setStatus('', false);
                    } else {
                        // 中途空页: 无论是否首页都终止加载, 防止无限补载
                        if (page === 1) {
                            setStatusHtml('No data yet. Browse the full catalog on ' +
                                '<a href="' + API_BASE + '" target="_blank" rel="noopener">ProductsX.app</a>', false);
                        }
                        hasMore = false;
                        disconnect();
                        loading = false;
                        return;
                    }

                    // 首屏内容不足一屏时哨兵始终处于交叉区, IntersectionObserver
                    // 不会再派发事件 → 主动续载下一页直到撑满视口
                    var needsMore = 'IntersectionObserver' in window
                        ? sentinelVisible
                        : (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600);
                    loading = false;
                    if (needsMore) loadMore();
                })
                .catch(function (err) {
                    loading = false;
                    setStatusHtml('Failed to load data (' + esc(err.message) + '). The API may be unreachable — visit ' +
                        '<a href="' + API_BASE + '" target="_blank" rel="noopener">ProductsX.app</a> directly.', true);
                    if (!retryBtnAdded) {
                        retryBtnAdded = true;
                        var btn = document.createElement('button');
                        btn.className = 'load-more-btn';
                        btn.type = 'button';
                        btn.textContent = 'Retry';
                        btn.addEventListener('click', function () {
                            btn.remove();
                            retryBtnAdded = false;
                            loadMore();
                        });
                        statusEl.after(btn);
                    }
                });
        }

        function disconnect() {
            if (sentinel) { sentinel.remove(); sentinel = null; }
        }

        // IntersectionObserver 哨兵: 接近底部时提前加载
        sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        container.after(sentinel);

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                sentinelVisible = entries[0].isIntersecting;
                if (sentinelVisible) loadMore();
            }, { rootMargin: '600px 0px' });
            io.observe(sentinel);
        } else {
            window.addEventListener('scroll', function () {
                if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
            }, { passive: true });
        }
    }

    // ─── 视图切换: Feed / Matrix (参考主站首页) ────────
    function initViewSwitcher() {
        var btnFeed = document.getElementById('btnFeedView');
        var btnMatrix = document.getElementById('btnMatrixView');
        var feedView = document.getElementById('feedView');
        var matrixView = document.getElementById('matrixView');
        if (!btnFeed || !btnMatrix) return;

        function switchView(toMatrix) {
            btnFeed.classList.toggle('active', !toMatrix);
            btnMatrix.classList.toggle('active', toMatrix);
            btnFeed.setAttribute('aria-selected', String(!toMatrix));
            btnMatrix.setAttribute('aria-selected', String(toMatrix));
            feedView.hidden = toMatrix;
            matrixView.hidden = !toMatrix;
        }

        btnFeed.addEventListener('click', function () { switchView(false); });
        btnMatrix.addEventListener('click', function () { switchView(true); });
    }

    // ─── 返回顶部 (加载第 3 页后出现, 同主站) ──────────
    function initBackToTop() {
        var btn = document.getElementById('backToTop');
        if (!btn) return;
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        return function (page) {
            btn.classList.toggle('show', page >= 3);
        };
    }

    // ─── 实时搜索建议: GET /api/search ─────────────────
    function initSearchSuggest() {
        var root = document.getElementById('pxSearchRoot');
        var input = document.getElementById('pxSearchInput');
        var dropdown = document.getElementById('pxSearchDropdown');
        var resultsBox = document.getElementById('pxSearchResults');
        if (!root || !input || !dropdown || !resultsBox) return;

        var debounceTimer = null;
        var activeIndex = -1;

        function highlight(text, query) {
            var str = String(text == null ? '' : text);
            var q = String(query || '').trim();
            if (!q) return esc(str);
            var lower = str.toLocaleLowerCase();
            var nq = q.toLocaleLowerCase();
            var out = '', cursor = 0, idx;
            while ((idx = lower.indexOf(nq, cursor)) !== -1) {
                out += esc(str.slice(cursor, idx)) + '<mark>' + esc(str.slice(idx, idx + q.length)) + '</mark>';
                cursor = idx + q.length;
            }
            return out + esc(str.slice(cursor));
        }

        function specLine(displaySpecs) {
            var arr = Array.isArray(displaySpecs) ? displaySpecs.slice(0, 3) : [];
            return arr.map(function (s) { return s.label + ': ' + s.value; }).join(' · ');
        }

        function close() {
            dropdown.classList.remove('open');
            dropdown.setAttribute('aria-hidden', 'true');
            input.setAttribute('aria-expanded', 'false');
            activeIndex = -1;
        }

        function open() {
            dropdown.classList.add('open');
            dropdown.setAttribute('aria-hidden', 'false');
            input.setAttribute('aria-expanded', 'true');
        }

        function renderResults(data, q) {
            var products = data.list || [];
            var companies = data.suppliers || [];
            var html = '';

            if (products.length) {
                html += '<div class="search-group-label">Products</div>';
                products.forEach(function (p, i) {
                    html += '<a class="search-result" role="option" data-idx="' + i + '" tabindex="-1" href="' +
                        API_BASE + (p.url || ('/p/' + encodeURIComponent(p.guid))) + '" target="_blank" rel="noopener">' +
                        '<div class="search-result-title">' + highlight(p.title, q) + '</div>' +
                        '<div class="search-result-sub">' + highlight(specLine(p.specs), q) + '</div>' +
                        '</a>';
                });
            }
            if (companies.length) {
                html += '<div class="search-group-label">Suppliers</div>';
                companies.forEach(function (c, i) {
                    var mains = Array.isArray(c.main_products) ? c.main_products.slice(0, 3).join(', ') : '';
                    var sub = [c.location, mains].filter(Boolean).join(' · ');
                    html += '<a class="search-result" role="option" data-idx="' + (products.length + i) + '" tabindex="-1" href="' +
                        API_BASE + (c.url || ('/supplier/' + encodeURIComponent(c.guid))) + '" target="_blank" rel="noopener">' +
                        '<div class="search-result-title">' + highlight(c.name, q) + '</div>' +
                        '<div class="search-result-sub">' + highlight(sub, q) + '</div>' +
                        '</a>';
                });
            }

            if (!html) {
                html = '<div class="search-empty">No results for “' + esc(q) + '” — try the full search on ProductsX.app</div>';
            }
            html += '<div class="search-footer">Press Enter for full results on ' +
                '<a href="' + API_BASE + '/search?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener">ProductsX.app</a></div>';
            resultsBox.innerHTML = html;
            activeIndex = -1;
            open();
        }

        function search(q) {
            fetchJson(API_BASE + '/api/search?q=' + encodeURIComponent(q))
                .then(function (res) {
                    renderResults((res && res.data) || {}, q);
                })
                .catch(function () { close(); });
        }

        function setActive(idx) {
            var items = resultsBox.querySelectorAll('.search-result');
            if (!items.length) { activeIndex = -1; return; }
            if (activeIndex >= 0 && items[activeIndex]) items[activeIndex].classList.remove('active');
            activeIndex = (idx + items.length) % items.length;
            items[activeIndex].classList.add('active');
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        }

        input.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            var q = input.value.trim();
            if (q.length < 2) { close(); return; }
            debounceTimer = setTimeout(function () { search(q); }, 250);
        });

        input.addEventListener('keydown', function (e) {
            var items = resultsBox.querySelectorAll('.search-result');
            if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setActive(activeIndex + 1); }
            else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setActive(activeIndex - 1); }
            else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
                e.preventDefault();
                items[activeIndex].click();
            } else if (e.key === 'Escape') { close(); }
        });

        input.addEventListener('focus', function () {
            if (input.value.trim().length >= 2 && resultsBox.children.length) open();
        });
        document.addEventListener('click', function (e) {
            if (!root.contains(e.target)) close();
        });
    }

    // ─── 页面初始化 ────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        initDetailPanel();
        initViewSwitcher();
        initSearchSuggest();
        var backToTopTick = initBackToTop();

        var isSupplierPage = !!document.getElementById('suppliers');

        if (isSupplierPage) {
            createFeedLoader({
                containerId: 'suppliers',
                statusId: 'supplierStatus',
                endpoint: '/api/companies',
                render: renderSupplierCard
            });
        } else {
            createFeedLoader({
                containerId: 'feed',
                statusId: 'feedStatus',
                endpoint: '/api/posts',
                render: renderCard,
                matrixContainerId: 'matrix',
                renderMatrix: renderMatrixRow,
                onCardClick: openDetailPanel,
                onMatrixClick: openDetailPanel,
                onPageLoaded: backToTopTick
            });
        }
    });
})();
