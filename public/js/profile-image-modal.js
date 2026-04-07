(function () {
  const imgModal = document.getElementById('image-modal');
  const imgModalContent = document.getElementById('image-modal-content');
  const imgModalImg = document.getElementById('image-modal-img');
  const imgModalClose = document.getElementById('image-modal-close');
  const profileContainer = document.getElementById('profile-container');
  const profileImg = document.getElementById('profile-img');

  if (!imgModal || !imgModalContent || !imgModalImg || !imgModalClose || !profileContainer || !profileImg) {
    return;
  }

  profileContainer.addEventListener('click', () => {
    imgModalImg.src = profileImg.src;
    imgModal.classList.add('visible');
    setTimeout(() => {
      imgModalContent.style.transform = 'scale(1)';
    }, 10);
  });

  const closeImgModal = () => {
    imgModalContent.style.transform = 'scale(0.9)';
    imgModal.classList.remove('visible');
  };

  imgModalClose.addEventListener('click', closeImgModal);
  imgModal.addEventListener('click', (event) => {
    if (event.target === imgModal) {
      closeImgModal();
    }
  });
})();
