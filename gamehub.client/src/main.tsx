import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importações
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// Componentes
import Login from './routes/Login.tsx'
import Register from './routes/Register.tsx'
import ForgotPassword from './routes/ForgotPassword.tsx'
import TermsOfCondition from './routes/TermsOfCondition.tsx'
import Logado from './routes/Logado.tsx'
import AnotherUserProfile from './routes/AnotherUserProfile.tsx'
import ErrorPage from './routes/ErrorPage.tsx'
import Profile from './routes/Profile.tsx'
import ListFollowersOrFollowing from './routes/ListFollowersOrFollowing.tsx'
import PostsUsersIsolated from './routes/PostsUsersIsolated.tsx'
import ListCommunities from './routes/ListCommunities.tsx'
import CommunityPage from './routes/CommunityPage.tsx'
import ListFollowingCommunity from './routes/ListFollowingCommunity.tsx'
import FollowingCommunitiesPost from './routes/FollowingCommunitiesPost.tsx'
import IsolatedPost from './routes/IsolatedPost.tsx'
import SearchList from './routes/SearchList.tsx'
import Library from './routes/Library.tsx'
import GamesPage from './routes/GamesPage.tsx'
import ListPostsGame from './routes/ListPostsGame.tsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Login/>,
      },
      {
        path: "register",
        element: <Register/>,
      },
      {
        path: "forgotPassword",
        element: <ForgotPassword/>,
      },
      {
        path: "termsOfCondition",
        element: <TermsOfCondition/>,
      },
      {
        path: "logado",
        element: <Logado/>,
      },
      {
        path: "profile",
        element: <Profile/>,
      },
      {
        path: "anotherProfile/:id",
        element: <AnotherUserProfile/>,
      },
      {
        path: "listFollowersOrFollowings/:id/:opt",
        element: <ListFollowersOrFollowing />,
      },
      {
        path: "listCommunities/:id/:opt",
        element: <ListCommunities />
      },
      {
        path: "communityPage/:id",
        element: <CommunityPage />
      },
      {
        path: "listFollowingCommunity/:id",
        element: <ListFollowingCommunity />
      },
      {
        path: "usersPosts",
        element: <PostsUsersIsolated />,
      },
      {
        path: "communitiesPosts",
        element: <FollowingCommunitiesPost />
      },
      {
        path: "post/:id",
        element: <IsolatedPost />
      },
      {
        path: "searchPage/:search",
        element: <SearchList />
      },
      {
        path: "library/:id",
        element: <Library />
      },
      {
        path: "gamesPage",
        element: <GamesPage />
      },
      {
        path: "searchPostsByGame",
        element: <ListPostsGame />
      },
      {
        path: "*",
        element: <ErrorPage/>,
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
