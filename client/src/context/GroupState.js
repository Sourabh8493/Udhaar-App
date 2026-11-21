import React, { useContext, useState } from 'react'
import GroupContext from './GroupContext'
import AlertContext from './AlertContext'
import { apiRequest, updateLastActive, clearAuthSession } from '../utils/api'

const GroupState = (props) => {
    const groupsInitial = []
    const [groups, setGroups] = useState(groupsInitial)

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const cached = localStorage.getItem("user");
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    })
    const [userByEmail, setUserByEmail] = useState({})

    const [currentGroup, setCurrentGroup] = useState({members: []})

    const alertContext = useContext(AlertContext)
    const showAlert = alertContext ? alertContext.showAlert : () => {}

    const getGroups = async () => {
        try {
            const json = await apiRequest('/api/groups/fetchallgroups')
            setGroups(Array.isArray(json) ? json : [])
        } catch (error) {
            showAlert(error.message, 'danger')
        }
    }

    const getUserDetails = async () => {
        try {
            const json = await apiRequest('/api/auth/getUser', { method: 'POST' })
            if (json) {
                if (json.authToken) {
                    localStorage.setItem('token', json.authToken);
                    updateLastActive();
                }
                localStorage.setItem('user', JSON.stringify({
                    _id: json._id,
                    name: json.name,
                    email: json.email
                }));
                setCurrentUser(json);
            }
        } catch (error) {
            showAlert(error.message, 'danger')
        }
    }

    const createGroup = async (title, members) => {
        try {
            await apiRequest('/api/groups/createGroup', {
                method: 'POST',
                body: { title, members },
            })
            await getGroups()
            showAlert('Group created successfully!', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const leaveGroup = async (groupid) => {
        try {
            await apiRequest(`/api/groups/leavegroup/${groupid}`, { method: 'PUT' })
            showAlert('You left the group', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const addMember = async (email, groupid) => {
        try {
            await apiRequest(`/api/groups/addmember/${encodeURIComponent(email)}/${groupid}`, { method: 'PUT' })
            await getGroup(groupid)
            showAlert('Member added successfully!', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const getGroup = async (groupid) => {
        try {
            const json = await apiRequest(`/api/groups/getGroup/${groupid}`)
            setCurrentGroup(json && json.members ? json : { members: [] })
        } catch (error) {
            showAlert(error.message, 'danger')
        }
    }

    const getUserByEmail = async (email) => {
        try {
            const json = await apiRequest(`/api/auth/getUserByEmail/${encodeURIComponent(email)}`, { method: 'POST' })
            setUserByEmail(json || {})
        } catch (error) {
            showAlert(error.message, 'danger')
        }
    }

    const deleteGroup = async (groupid) => {
        try {
            await apiRequest(`/api/groups/deletegroup/${groupid}`, { method: 'DELETE' })
            await getGroups()
            showAlert('Group deleted', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const updateGroup = async (groupid, title) => {
        try {
            await apiRequest(`/api/groups/updateGroup/${groupid}`, {
                method: 'PUT',
                body: { title },
            })
            await getGroup(groupid)
            await getGroups()
            showAlert('Group updated', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const updateProfile = async (name) => {
        try {
            const json = await apiRequest('/api/auth/updateProfile', {
                method: 'PUT',
                body: { name },
            })
            if (json && json.user) {
                localStorage.setItem('user', JSON.stringify({
                    _id: json.user._id,
                    name: json.user.name,
                    email: json.user.email
                }));
                setCurrentUser(json.user);
            }
            showAlert('Profile updated', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const json = await apiRequest('/api/auth/changePassword', {
                method: 'PUT',
                body: { currentPassword, newPassword },
            })
            showAlert(json.message || 'Password changed', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

    const deleteAccount = async () => {
        try {
            await apiRequest('/api/auth/deleteAccount', { method: 'DELETE' })
            clearAuthSession()
            showAlert('Account deleted', 'success')
            return true
        } catch (error) {
            showAlert(error.message, 'danger')
            return false
        }
    }

  return (
    <GroupContext.Provider value={{groups, getGroups, getUserDetails, currentUser, createGroup, leaveGroup, addMember, currentGroup, getGroup, getUserByEmail, userByEmail, deleteGroup, updateGroup, updateProfile, changePassword, deleteAccount}}>
        {props.children}
    </GroupContext.Provider>
  )
}

export default GroupState
