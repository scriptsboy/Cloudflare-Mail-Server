document.addEventListener('DOMContentLoaded', function() {
    // 分页功能
    const pageSizeSelect = document.getElementById('page-size-select');
    const pageInput = document.getElementById('page-input');
    const pageSizeInput = document.getElementById('page-size-input');
    const filterForm = document.getElementById('filter-form');

    // 使整个账号卡片可点击并跳转到邮件列表
    const accountCards = document.querySelectorAll('.account-card');
    accountCards.forEach(card => {
        card.style.cursor = 'pointer'; // 添加指针样式，提示可点击

        card.addEventListener('click', function(e) {
            // 如果点击的是操作按钮或其子元素，不进行跳转
            if (e.target.closest('.actions') || e.target.closest('.action-btn')) {
                return;
            }

            // 获取邮箱地址并跳转
            const email = this.getAttribute('data-email');
            if (email) {
                window.location.href = `/mail?recipient=${encodeURIComponent(email)}`;
            }
        });
    });

    // 每页显示数量变化时，提交表单
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            pageSizeInput.value = this.value;
            pageInput.value = 1; // 切换每页显示数量时，回到第一页
            filterForm.submit();
        });
    }

    // 复制功能
    function copyToClipboard(text) {
        // 创建临时输入框
        const input = document.createElement('input');
        input.style.position = 'fixed';
        input.style.opacity = 0;
        input.value = text;
        document.body.appendChild(input);

        // 选择并复制
        input.select();
        document.execCommand('copy');

        // 移除临时输入框
        document.body.removeChild(input);

        // 显示提示
        showToast('复制成功！');
    }

    function showToast(message) {
        // 检查是否已存在toast
        let toast = document.querySelector('.toast-message');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-message';
            document.body.appendChild(toast);
        }

        // 设置消息并显示
        toast.textContent = message;
        toast.classList.add('show');

        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 复制邮箱
    const copyEmailButtons = document.querySelectorAll('.copy-email-btn');
    copyEmailButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.account-card');
            const email = card.getAttribute('data-email');
            copyToClipboard(email);
        });
    });

    // 复制密码
    const copyPasswordButtons = document.querySelectorAll('.copy-password-btn');
    copyPasswordButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.account-card');
            const password = card.getAttribute('data-password');
            if (password && password.trim() !== '') {
                copyToClipboard(password);
            } else {
                showToast('没有可用的密码，请先重置密码');
            }
        });
    });

    // 删除功能
    const deleteModal = document.getElementById('delete-modal');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const deleteModalCancelBtn = deleteModal.querySelector('.cancel-btn');
    const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
    const deleteModalCloseBtn = deleteModal.querySelector('.close-btn');

    let currentAccountId = null;

    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // 阻止事件冒泡，避免触发卡片点击事件
            e.stopPropagation();

            const card = this.closest('.account-card');
            currentAccountId = card.getAttribute('data-id');
            deleteModal.classList.add('show');
        });
    });

    function closeDeleteModal() {
        deleteModal.classList.remove('show');
        currentAccountId = null;
    }

    deleteModalCancelBtn.addEventListener('click', closeDeleteModal);
    deleteModalCloseBtn.addEventListener('click', closeDeleteModal);

    confirmDeleteBtn.addEventListener('click', function() {
        if (currentAccountId) {
            // 发送删除请求
            fetch(`/accounts/delete/${currentAccountId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 删除成功，刷新页面
                    window.location.reload();
                } else {
                    alert('删除失败，请重试');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('删除失败，请重试');
            })
            .finally(() => {
                closeDeleteModal();
            });
        }
    });

    // 重置密码功能
    const resetPasswordModal = document.getElementById('reset-password-modal');
    const resetPasswordButtons = document.querySelectorAll('.reset-password-btn');
    const resetPasswordModalCancelBtn = resetPasswordModal.querySelector('.cancel-btn');
    const confirmResetBtn = resetPasswordModal.querySelector('.confirm-reset-btn');
    const resetPasswordModalCloseBtn = resetPasswordModal.querySelector('.close-btn');
    const resetPasswordDoneBtn = resetPasswordModal.querySelector('.done-btn');
    const resetPasswordResult = document.getElementById('reset-password-result');
    const newPasswordInput = document.getElementById('new-password');
    const copyNewPasswordBtn = resetPasswordModal.querySelector('.copy-new-password-btn');

    let currentResetAccountId = null;

    resetPasswordButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.account-card');
            currentResetAccountId = card.getAttribute('data-id');

            // 重置模态框状态
            resetPasswordResult.style.display = 'none';
            confirmResetBtn.style.display = '';
            resetPasswordModalCancelBtn.style.display = '';
            resetPasswordDoneBtn.style.display = 'none';

            resetPasswordModal.classList.add('show');
        });
    });

    function closeResetPasswordModal() {
        resetPasswordModal.classList.remove('show');
        currentResetAccountId = null;
    }

    resetPasswordModalCancelBtn.addEventListener('click', closeResetPasswordModal);
    resetPasswordModalCloseBtn.addEventListener('click', closeResetPasswordModal);
    resetPasswordDoneBtn.addEventListener('click', function() {
        window.location.reload();
    });

    confirmResetBtn.addEventListener('click', function() {
        if (currentResetAccountId) {
            // 发送重置密码请求
            fetch(`/accounts/reset-password/${currentResetAccountId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 显示新密码
                    newPasswordInput.value = data.password;
                    resetPasswordResult.style.display = 'block';
                    confirmResetBtn.style.display = 'none';
                    resetPasswordModalCancelBtn.style.display = 'none';
                    resetPasswordDoneBtn.style.display = '';
                } else {
                    alert(`重置密码失败: ${data.error || '未知错误'}`);
                    closeResetPasswordModal();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('重置密码失败，请重试');
                closeResetPasswordModal();
            });
        }
    });

    // 复制新密码
    copyNewPasswordBtn.addEventListener('click', function() {
        copyToClipboard(newPasswordInput.value);
    });


});
