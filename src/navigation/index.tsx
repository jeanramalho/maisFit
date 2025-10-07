import React from "react";
import { CreateNativeStackNavigation } from "@react-navigation/native-stack";
import { LoginScreen } from "../views/LoginScreen";
import { HomeScreen } from "../views/HomeScreen";

export type RootStackParamList = {
    Login: undefined;
    Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
    return (
        <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={ { 
                headerShown: false,
            }}
            >
                <Stack.Screen name="Login" component={LoginScreen}/>
                <Stack.Screen name="Home" component={HomeScreen}/>
            </Stack.Navigator>
    );
};