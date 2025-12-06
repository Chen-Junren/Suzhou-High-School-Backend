// 社团列表页面脚本

// 全局变量
let currentPage = 1;
const pageSize = 10;

$(document).ready(function() {
    // 初始化导航栏状态
    updateNavbar();
    
    // 检查用户登录状态，如果已登录则显示创建社团按钮
    if (isLoggedIn()) {
        $('#create-club-btn').removeClass('d-none');
    }
    
    // 加载社团列表
    loadClubs();
    
    // 搜索表单提交事件
    $('#search-form').on('submit', function(event) {
        event.preventDefault();
        currentPage = 1; // 重置为第一页
        loadClubs();
    });
    
    // 重置筛选条件
    $('#reset-filter').on('click', function() {
        $('#search-input').val('');
        $('#category-filter').val('');
        $('#sort-order').val('-created_at');
        currentPage = 1; // 重置为第一页
        loadClubs();
    });
});

// 加载社团列表
function loadClubs() {
    // 获取筛选条件
    const searchQuery = $('#search-input').val().trim();
    const category = $('#category-filter').val();
    const sortOrder = $('#sort-order').val();
    
    // 构建URL参数
    const params = new URLSearchParams({
        page: currentPage,
        page_size: pageSize,
        ordering: sortOrder
    });
    
    if (searchQuery) {
        params.append('search', searchQuery);
    }
    
    if (category) {
        params.append('category', category);
    }
    
    const url = `/clubs/?${params.toString()}`;
    
    // 显示加载状态
    const clubsContainer = $('#clubs-container');
    clubsContainer.empty();
    clubsContainer.append($('#loading-message').clone().removeClass('d-none'));
    
    apiRequest(url, 'GET', null, false)
        .then(function(response) {
            clubsContainer.empty();
            
            if (response.results && response.results.length > 0) {
                // 渲染社团列表
                response.results.forEach(function(club) {
                    const clubCard = createClubCard(club);
                    clubsContainer.append(clubCard);
                });
                
                // 渲染分页
                renderPagination(response.count, currentPage, pageSize);
            } else {
                // 显示无社团消息
                const emptyMessage = `
                    <div class="col-12 no-clubs">
                        <div class="mb-3">
                            <i class="fa fa-building-o text-5xl text-muted"></i>
                        </div>
                        <h4>没有找到符合条件的社团</h4>
                        <p>尝试修改搜索条件或创建一个新的社团</p>
                        ${isLoggedIn() ? '<a href="create-club.html" class="btn btn-primary mt-2">创建社团</a>' : ''}
                    </div>
                `;
                clubsContainer.append(emptyMessage);
                $('#pagination').empty();
            }
        })
        .catch(function(error) {
            console.error('加载社团列表失败:', error);
            
            // 显示错误消息
            const errorMessage = `
                <div class="col-12 no-clubs">
                    <div class="mb-3">
                        <i class="fa fa-exclamation-circle text-5xl text-danger"></i>
                    </div>
                    <h4>加载失败</h4>
                    <p>无法加载社团列表，请稍后再试</p>
                    <button class="btn btn-outline-primary mt-2" onclick="loadClubs()">重试</button>
                </div>
            `;
            clubsContainer.html(errorMessage);
            $('#pagination').empty();
        });
}

// 创建社团卡片
function createClubCard(club) {
    // 检查用户是否已登录并是该社团的成员
    const user = getUser();
    const isMember = user && club.members.some(member => member.id === user.id);
    
    // 检查用户是否是该社团的领导者
    const isLeader = user && club.leader.id === user.id;
    
    const cardHtml = `
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">${club.name}</h5>
                        <span class="badge bg-primary">${club.category}</span>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${club.description}</p>
                    <div class="mt-2 text-muted">
                        <small><i class="fa fa-user-circle mr-1"></i>社长: ${club.leader.username}</small>
                        <small class="ml-3"><i class="fa fa-users mr-1"></i>${club.members.length} 成员</small>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between">
                        <small class="text-muted">创建于: ${formatDate(club.created_at)}</small>
                        <div>
                            <a href="club-detail.html?id=${club.id}" class="btn btn-outline-primary btn-sm mr-1">
                                <i class="fa fa-eye mr-1"></i>详情
                            </a>
                            ${isLeader ? `
                                <a href="manage-club.html?id=${club.id}" class="btn btn-primary btn-sm">
                                    <i class="fa fa-cog mr-1"></i>管理
                                </a>
                            ` : isMember ? `
                                <button class="btn btn-outline-warning btn-sm" onclick="leaveClub(${club.id}, this)">
                                    <i class="fa fa-sign-out mr-1"></i>退出
                                </button>
                            ` : isLoggedIn() ? `
                                <button class="btn btn-outline-success btn-sm" onclick="joinClub(${club.id}, this)">
                                    <i class="fa fa-sign-in mr-1"></i>加入
                                </button>
                            ` : ``}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return cardHtml;
}

// 渲染分页控件
function renderPagination(totalCount, currentPage, pageSize) {
    const pagination = $('#pagination');
    pagination.empty();
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    if (totalPages <= 1) {
        return; // 只有一页，不需要分页
    }
    
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;
    
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    const paginationHTML = `
        <ul class="pagination">
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1})"><i class="fa fa-chevron-left"></i></a>
            </li>
            ${Array.from({length: endPage - startPage + 1}, (_, i) => {
                const pageNum = startPage + i;
                return `
                    <li class="page-item ${currentPage === pageNum ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${pageNum})"><i class="fa fa-circle-o"></i> ${pageNum}</a>
                    </li>
                `;
            }).join('')}
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1})"><i class="fa fa-chevron-right"></i></a>
            </li>
        </ul>
    `;
    
    pagination.html(paginationHTML);
}

// 切换页面
function changePage(page) {
    if (page < 1) return;
    
    const totalCount = parseInt($('#pagination').data('total-count') || 0);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    if (page > totalPages) return;
    
    currentPage = page;
    loadClubs();
    
    // 滚动到页面顶部
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// 加入社团
function joinClub(clubId, button) {
    // 检查用户是否已登录
    if (!isLoggedIn()) {
        window.location.href = `login.html?next=clubs.html`;
        return;
    }
    
    // 显示加载状态
    const originalText = $(button).html();
    $(button).html('<i class="fa fa-spinner fa-spin"></i>加入中...');
    $(button).prop('disabled', true);
    
    apiRequest(`/clubs/${clubId}/join/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功加入社团', 'success');
            // 重新加载社团列表
            loadClubs();
        })
        .catch(function(error) {
            console.error('加入社团失败:', error);
            
            let errorMessage = '加入社团失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            $(button).html(originalText);
            $(button).prop('disabled', false);
        });
}

// 退出社团
function leaveClub(clubId, button) {
    // 确认退出
    if (!confirm('确定要退出该社团吗？')) {
        return;
    }
    
    // 显示加载状态
    const originalText = $(button).html();
    $(button).html('<i class="fa fa-spinner fa-spin"></i>退出中...');
    $(button).prop('disabled', true);
    
    apiRequest(`/clubs/${clubId}/leave/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功退出社团', 'success');
            // 重新加载社团列表
            loadClubs();
        })
        .catch(function(error) {
            console.error('退出社团失败:', error);
            
            let errorMessage = '退出社团失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            $(button).html(originalText);
            $(button).prop('disabled', false);
        });
}