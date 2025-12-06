// 首页脚本

$(document).ready(function() {
    // 加载特色社团
    loadFeaturedClubs();
});

// 加载特色社团
function loadFeaturedClubs() {
    apiRequest('/clubs/', 'GET', null, false)
        .then(function(response) {
            // 清空容器
            $('#featured-clubs').empty();

            // 如果有社团数据
            if (response.length > 0) {
                // 限制显示前3个社团作为特色
                const featuredClubs = response.slice(0, 3);

                featuredClubs.forEach(function(club) {
                    const clubCard = `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 card-hover">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h5 class="card-title mb-0">${club.name}</h5>
                                        <span class="badge bg-primary">${club.category}</span>
                                    </div>
                                    <p class="card-text text-truncate">${club.description}</p>
                                    <div class="mt-2 text-muted">
                                        <small><i class="fa fa-user-circle mr-1"></i>${club.leader.username}</small>
                                        <small class="ml-3"><i class="fa fa-users mr-1"></i>${club.members.length} 成员</small>
                                    </div>
                                    <div class="mt-2">
                                        <small class="text-muted">创建于: ${formatDate(club.created_at)}</small>
                                    </div>
                                    <a href="club-detail.html?id=${club.id}" class="btn btn-outline-primary mt-3">查看详情</a>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#featured-clubs').append(clubCard);
                });
            } else {
                // 如果没有社团数据
                const emptyMessage = `
                    <div class="col-12 text-center py-5">
                        <div class="mb-3">
                            <i class="fa fa-building-o text-5xl text-muted"></i>
                        </div>
                        <h4>暂无社团</h4>
                        <p class="text-muted">还没有任何社团创建，来创建第一个社团吧！</p>
                        ${isLoggedIn() ? '<a href="create-club.html" class="btn btn-primary mt-2">创建社团</a>' : '<a href="login.html" class="btn btn-primary mt-2">登录后创建</a>'}
                    </div>
                `;
                $('#featured-clubs').append(emptyMessage);
            }
        })
        .catch(function(error) {
            console.error('加载特色社团失败:', error);
            // 保留静态内容作为后备
        });
}