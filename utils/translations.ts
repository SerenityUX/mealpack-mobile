import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the translation keys
export type TranslationKey = 
  // Profile page
  | 'profile'
  | 'tapToUploadProfilePicture'
  | 'uploadProfilePicture'
  | 'inputName'
  | 'guestUser'
  | 'connectYourEmail'
  | 'connectEmailDescription'
  | 'enterYourEmail'
  | 'connect'
  | 'language'
  | 'signOut'
  | 'deleteAccount'
  | 'deleteAccountPrompt'
  | 'profilePictureUpdated'
  | 'nameUpdated'
  | 'emailConnectedSuccessfully'
  
  // Auth page
  | 'welcomeToMealPack'
  | 'continueWithEmail'
  | 'continueAsGuest'
  | 'enterEmail'
  | 'continue'
  | 'enterVerificationCode'
  | 'resendCode'
  | 'byCreatingAccount'
  | 'termsOfService'
  | 'privacyPolicy'
  
  // List page
  | 'appTitle'
  | 'enterShareCode'
  | 'enterCodeToClaimRecipe'
  | 'claim'
  | 'loginRequired'
  | 'needLoginToClaimRecipe'
  | 'ok'
  | 'recipeAdded'
  | 'viewRecipe'
  | 'writeRecipe'
  | 'generateRecipe'
  | 'noRecipesMessage'
  | 'pullToRefresh'
  
  // Create/Edit page
  | 'recipeName'
  | 'recipeImage'
  | 'recipeDescription'
  | 'ingredients'
  | 'directions'
  | 'addIngredient'
  | 'addDirection'
  | 'addNewIngredient'
  | 'addNewDirection'
  | 'create'
  | 'saveChanges'
  | 'uploadingImage'
  | 'creatingRecipe'
  | 'savingChanges'
  
  // Generate page
  | 'generatingRecipe'
  | 'selectImageToGenerate'
  | 'editRecipePrompt'
  | 'regenerateRecipe'
  | 'generationInProgress'
  | 'generationError'
  | 'generationComplete'
  | 'editRequest'
  | 'submitEdit'
  | 'processingEdit'
  | 'generatingName'
  | 'generatingDescription'
  | 'generatingIngredients'
  | 'generatingDirections'
  
  // Detail page
  | 'edit'
  | 'share'
  | 'shareByEmail'
  | 'qrCode'
  | 'deleteRecipe'
  | 'deleteRecipeConfirm'
  | 'noRecipeData'
  | 'sharedByUser'
  | 'shareRecipeByEmail'
  | 'enterEmailToShare'
  | 'userNotFound'
  | 'alreadyShared'
  | 'recipeSharedSuccess'
  | 'options'
  
  // Common
  | 'loading'
  | 'save'
  | 'delete'
  | 'cancel'
  | 'success'
  | 'error';

// Define the languages
export type Language = 'English' | 'Spanish' | 'Mandarin';

// Define the translations
export const translations: Record<Language, Record<TranslationKey, string>> = {
  English: {
    // Profile page
    profile: 'Profile',
    tapToUploadProfilePicture: 'Tap to upload profile picture',
    uploadProfilePicture: 'Upload profile picture',
    inputName: 'Input Name',
    guestUser: 'Guest User',
    connectYourEmail: 'Connect Your Email',
    connectEmailDescription: 'Connect your email to enable recipe sharing and access all features.',
    enterYourEmail: 'Enter your email',
    connect: 'Connect',
    language: 'Language',
    signOut: 'Sign out',
    deleteAccount: 'Delete Account',
    deleteAccountPrompt: 'This action cannot be undone. All your recipes and data will be permanently deleted. Type "Delete My Account" to confirm.',
    profilePictureUpdated: 'Profile picture updated',
    nameUpdated: 'Name updated',
    emailConnectedSuccessfully: 'Email connected successfully',
    
    // Auth page
    welcomeToMealPack: 'Welcome to MealPack',
    continueWithEmail: 'Continue with Email',
    continueAsGuest: 'Continue as Guest',
    enterEmail: 'Enter your email',
    continue: 'Continue',
    enterVerificationCode: 'Enter verification code',
    resendCode: 'Resend Code',
    byCreatingAccount: 'By creating an account, you agree to our',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    
    // List page
    appTitle: 'Meal Pack',
    enterShareCode: 'Enter Share Code',
    enterCodeToClaimRecipe: 'Enter the code to claim a recipe',
    claim: 'Claim',
    loginRequired: 'Login Required',
    needLoginToClaimRecipe: 'You need to be logged in to claim a recipe',
    ok: 'OK',
    recipeAdded: 'Recipe Added!',
    viewRecipe: 'View Recipe',
    writeRecipe: 'Write Recipe',
    generateRecipe: 'Generate Recipe',
    noRecipesMessage: 'You have no recipes. Create your first recipe or ask a friend to share one with you',
    pullToRefresh: 'Pull to refresh',
    
    // Create/Edit page
    recipeName: 'Recipe Name',
    recipeImage: 'Recipe Image',
    recipeDescription: 'Recipe Description',
    ingredients: 'Ingredients',
    directions: 'Directions',
    addIngredient: 'Add ingredient',
    addDirection: 'Add direction',
    addNewIngredient: '+ Add new ingredient',
    addNewDirection: '+ Add new direction',
    create: 'Create',
    saveChanges: 'Save Changes',
    uploadingImage: 'Awaiting image upload to be able to create recipe',
    creatingRecipe: 'Creating recipe...',
    savingChanges: 'Saving changes...',
    
    // Generate page
    generatingRecipe: 'Generating recipe...',
    selectImageToGenerate: 'Select an image to generate a recipe',
    editRecipePrompt: 'How would you like to edit the recipe?',
    regenerateRecipe: 'Regenerate Recipe',
    generationInProgress: 'Generation in progress...',
    generationError: 'Error generating recipe',
    generationComplete: 'Generation complete!',
    editRequest: 'Edit request',
    submitEdit: 'Submit Edit',
    processingEdit: 'Processing edit...',
    generatingName: 'Generating recipe name...',
    generatingDescription: 'Generating description...',
    generatingIngredients: 'Generating ingredients...',
    generatingDirections: 'Generating directions...',
    
    // Detail page
    edit: 'Edit',
    share: 'Share',
    shareByEmail: 'Share by Email',
    qrCode: 'QR Code',
    deleteRecipe: 'Delete Recipe',
    deleteRecipeConfirm: 'Are you sure you want to delete this recipe?',
    noRecipeData: 'No recipe data.',
    sharedByUser: 'shared this recipe with you',
    shareRecipeByEmail: 'Share Recipe by Email',
    enterEmailToShare: 'Enter the email of the person you want to share with:',
    userNotFound: 'No user with that email exists.',
    alreadyShared: 'You have already shared this recipe with that user.',
    recipeSharedSuccess: 'Recipe shared successfully!',
    options: 'Options',
    
    // Common
    loading: 'Loading',
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    success: 'Success',
    error: 'Error',
  },
  Spanish: {
    // Profile page
    profile: 'Perfil',
    tapToUploadProfilePicture: 'Toca para subir foto de perfil',
    uploadProfilePicture: 'Subir foto de perfil',
    inputName: 'Ingresar nombre',
    guestUser: 'Usuario invitado',
    connectYourEmail: 'Conecta tu correo electrónico',
    connectEmailDescription: 'Conecta tu correo electrónico para habilitar el intercambio de recetas y acceder a todas las funciones.',
    enterYourEmail: 'Ingresa tu correo electrónico',
    connect: 'Conectar',
    language: 'Idioma',
    signOut: 'Cerrar sesión',
    deleteAccount: 'Eliminar cuenta',
    deleteAccountPrompt: 'Esta acción no se puede deshacer. Todas tus recetas y datos se eliminarán permanentemente. Escribe "Delete My Account" para confirmar.',
    profilePictureUpdated: 'Foto de perfil actualizada',
    nameUpdated: 'Nombre actualizado',
    emailConnectedSuccessfully: 'Correo electrónico conectado exitosamente',
    
    // Auth page
    welcomeToMealPack: 'Bienvenido a MealPack',
    continueWithEmail: 'Continuar con correo electrónico',
    continueAsGuest: 'Continuar como invitado',
    enterEmail: 'Ingresa tu correo electrónico',
    continue: 'Continuar',
    enterVerificationCode: 'Ingresa el código de verificación',
    resendCode: 'Reenviar código',
    byCreatingAccount: 'Al crear una cuenta, aceptas nuestros',
    termsOfService: 'Términos de servicio',
    privacyPolicy: 'Política de privacidad',
    
    // List page
    appTitle: 'Meal Pack',
    enterShareCode: 'Ingresar código de compartir',
    enterCodeToClaimRecipe: 'Ingresa el código para reclamar una receta',
    claim: 'Reclamar',
    loginRequired: 'Inicio de sesión requerido',
    needLoginToClaimRecipe: 'Necesitas iniciar sesión para reclamar una receta',
    ok: 'OK',
    recipeAdded: '¡Receta añadida!',
    viewRecipe: 'Ver receta',
    writeRecipe: 'Escribir receta',
    generateRecipe: 'Generar receta',
    noRecipesMessage: 'No tienes recetas. Crea tu primera receta o pide a un amigo que comparta una contigo',
    pullToRefresh: 'Desliza para actualizar',
    
    // Create/Edit page
    recipeName: 'Nombre de la receta',
    recipeImage: 'Imagen de la receta',
    recipeDescription: 'Descripción de la receta',
    ingredients: 'Ingredientes',
    directions: 'Instrucciones',
    addIngredient: 'Añadir ingrediente',
    addDirection: 'Añadir instrucción',
    addNewIngredient: '+ Añadir nuevo ingrediente',
    addNewDirection: '+ Añadir nueva instrucción',
    create: 'Crear',
    saveChanges: 'Guardar cambios',
    uploadingImage: 'Esperando la carga de la imagen para poder crear la receta',
    creatingRecipe: 'Creando receta...',
    savingChanges: 'Guardando cambios...',
    
    // Generate page
    generatingRecipe: 'Generando receta...',
    selectImageToGenerate: 'Selecciona una imagen para generar una receta',
    editRecipePrompt: '¿Cómo te gustaría editar la receta?',
    regenerateRecipe: 'Regenerar Receta',
    generationInProgress: 'Generación en progreso...',
    generationError: 'Error al generar la receta',
    generationComplete: '¡Generación completa!',
    editRequest: 'Solicitud de edición',
    submitEdit: 'Enviar Edición',
    processingEdit: 'Procesando edición...',
    generatingName: 'Generando nombre de receta...',
    generatingDescription: 'Generando descripción...',
    generatingIngredients: 'Generando ingredientes...',
    generatingDirections: 'Generando instrucciones...',
    
    // Detail page
    edit: 'Editar',
    share: 'Compartir',
    shareByEmail: 'Compartir por correo',
    qrCode: 'Código QR',
    deleteRecipe: 'Eliminar receta',
    deleteRecipeConfirm: '¿Estás seguro de que quieres eliminar esta receta?',
    noRecipeData: 'No hay datos de receta.',
    sharedByUser: 'compartió esta receta contigo',
    shareRecipeByEmail: 'Compartir receta por correo',
    enterEmailToShare: 'Ingresa el correo electrónico de la persona con quien quieres compartir:',
    userNotFound: 'No existe ningún usuario con ese correo electrónico.',
    alreadyShared: 'Ya has compartido esta receta con ese usuario.',
    recipeSharedSuccess: '¡Receta compartida con éxito!',
    options: 'Opciones',
    
    // Common
    loading: 'Cargando',
    save: 'Guardar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    success: 'Éxito',
    error: 'Error',
  },
  Mandarin: {
    // Profile page
    profile: '个人资料',
    tapToUploadProfilePicture: '点击上传头像',
    uploadProfilePicture: '上传头像',
    inputName: '输入姓名',
    guestUser: '访客用户',
    connectYourEmail: '关联您的电子邮箱',
    connectEmailDescription: '关联您的电子邮箱以启用食谱分享并访问所有功能。',
    enterYourEmail: '输入您的电子邮箱',
    connect: '关联',
    language: '语言',
    signOut: '退出登录',
    deleteAccount: '删除账户',
    deleteAccountPrompt: '此操作无法撤销。您的所有食谱和数据将被永久删除。输入"Delete My Account"确认。',
    profilePictureUpdated: '头像已更新',
    nameUpdated: '姓名已更新',
    emailConnectedSuccessfully: '邮箱关联成功',
    
    // Auth page
    welcomeToMealPack: '欢迎使用MealPack',
    continueWithEmail: '使用电子邮箱继续',
    continueAsGuest: '以访客身份继续',
    enterEmail: '输入您的电子邮箱',
    continue: '继续',
    enterVerificationCode: '输入验证码',
    resendCode: '重新发送验证码',
    byCreatingAccount: '创建账户即表示您同意我们的',
    termsOfService: '服务条款',
    privacyPolicy: '隐私政策',
    
    // List page
    appTitle: 'Meal Pack',
    enterShareCode: '输入分享码',
    enterCodeToClaimRecipe: '输入代码领取食谱',
    claim: '领取',
    loginRequired: '需要登录',
    needLoginToClaimRecipe: '您需要登录才能领取食谱',
    ok: '确定',
    recipeAdded: '食谱已添加！',
    viewRecipe: '查看食谱',
    writeRecipe: '撰写食谱',
    generateRecipe: '生成食谱',
    noRecipesMessage: '您没有食谱。创建您的第一个食谱或请朋友与您分享',
    pullToRefresh: '下拉刷新',
    
    // Create/Edit page
    recipeName: '食谱名称',
    recipeImage: '食谱图片',
    recipeDescription: '食谱描述',
    ingredients: '食材',
    directions: '步骤',
    addIngredient: '添加食材',
    addDirection: '添加步骤',
    addNewIngredient: '+ 添加新食材',
    addNewDirection: '+ 添加新步骤',
    create: '创建',
    saveChanges: '保存更改',
    uploadingImage: '等待图片上传以创建食谱',
    creatingRecipe: '正在创建食谱...',
    savingChanges: '正在保存更改...',
    
    // Generate page
    generatingRecipe: '正在生成食谱...',
    selectImageToGenerate: '选择一张图片来生成食谱',
    editRecipePrompt: '您想如何编辑这个食谱？',
    regenerateRecipe: '重新生成食谱',
    generationInProgress: '生成进行中...',
    generationError: '生成食谱时出错',
    generationComplete: '生成完成！',
    editRequest: '编辑请求',
    submitEdit: '提交编辑',
    processingEdit: '处理编辑中...',
    generatingName: '正在生成食谱名称...',
    generatingDescription: '正在生成描述...',
    generatingIngredients: '正在生成食材...',
    generatingDirections: '正在生成步骤...',
    
    // Detail page
    edit: '编辑',
    share: '分享',
    shareByEmail: '通过邮件分享',
    qrCode: '二维码',
    deleteRecipe: '删除食谱',
    deleteRecipeConfirm: '您确定要删除这个食谱吗？',
    noRecipeData: '没有食谱数据。',
    sharedByUser: '与您分享了这个食谱',
    shareRecipeByEmail: '通过邮件分享食谱',
    enterEmailToShare: '输入您想分享的人的电子邮箱：',
    userNotFound: '没有找到使用该电子邮箱的用户。',
    alreadyShared: '您已经与该用户分享了此食谱。',
    recipeSharedSuccess: '食谱分享成功！',
    options: '选项',
    
    // Common
    loading: '加载中',
    save: '保存',
    delete: '删除',
    cancel: '取消',
    success: '成功',
    error: '错误',
  }
};

// Create a hook for translations
let currentLanguage: Language = 'English';

// Initialize language from AsyncStorage
export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language_preference');
    if (savedLanguage && (savedLanguage === 'English' || savedLanguage === 'Spanish' || savedLanguage === 'Mandarin')) {
      currentLanguage = savedLanguage;
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
  }
};

// Get translation for a key
export const t = (key: TranslationKey): string => {
  return translations[currentLanguage][key] || translations.English[key];
};

// Set current language
export const setLanguage = async (language: Language): Promise<void> => {
  currentLanguage = language;
  try {
    await AsyncStorage.setItem('language_preference', language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Get current language
export const getLanguage = (): Language => {
  return currentLanguage;
}; 