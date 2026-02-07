const openButtons = document.querySelectorAll('.btn-seta');

openButtons.forEach(button => {
    button.addEventListener('click', ()=>{
        const modalId = button.dataset.modal;
        const modal = document.getElementById(modalId);
        
        modal.showModal();
    });
});

const closeButton = document.querySelectorAll('.close-modal');

closeButton.forEach(button =>{
    button.addEventListener('click', ()=>{
        const modalId = button.dataset.modal;
        const modal = document.getElementById(modalId);

        modal.close();
    });
});
