export type RootStackParamList = {
  Auth: undefined;
  WorkerTabs: undefined;
  AdminTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type WorkerHomeStackParamList = {
  WorkerHome: undefined;
  PieceEntry: undefined;
  TimeClock: undefined;
};

export type AdminHomeStackParamList = {
  AdminHome: undefined;
  EmployeeList: undefined;
  EmployeeForm: { userId?: string };
  ProductList: undefined;
  ProductForm: { productId?: string };
};
