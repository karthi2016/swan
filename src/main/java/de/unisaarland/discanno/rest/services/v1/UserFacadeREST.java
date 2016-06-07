/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.unisaarland.discanno.rest.services.v1;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.unisaarland.discanno.LoginUtil;
import de.unisaarland.discanno.Utility;
import de.unisaarland.discanno.business.Service;
import de.unisaarland.discanno.dao.ProjectDAO;
import de.unisaarland.discanno.dao.UsersDAO;
import de.unisaarland.discanno.entities.Users;
import de.unisaarland.discanno.rest.view.View;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.CreateException;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.NoResultException;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * The REST service responsible for users.
 *
 * @author Timo Guehring
 */
@Stateless
@Path("/user")
public class UserFacadeREST extends AbstractFacade<Users> {
    
    // Needed to write JSON with specific properties e.g. views
    private static ObjectMapper mapper = new ObjectMapper();
    
    @EJB
    Service service;
    
    @EJB
    ProjectDAO projectDAO;
    
    @EJB
    UsersDAO usersDAO;
    
    
    /**
     * Inserts an user and hashes the password before.
     * 
     * @param entity
     * @param Users entity
     * @return  
     */
    @POST
    @Consumes({MediaType.APPLICATION_JSON})
    public Response create(Users entity) {
        
        try {
            String session = getSessionID();
            LoginUtil.check(usersDAO.checkLogin(session, Users.RoleType.projectmanager));
            service.process(usersDAO.getUserBySession(session), entity);
            return usersDAO.create(entity);
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN).build();
        } catch (CreateException e) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        
    }
    
    @POST
    @Path("/reset")
    @Consumes({MediaType.APPLICATION_JSON})
    public Response resetUserPassword(Users entity) {
        
        try {   
            LoginUtil.check(usersDAO.checkLogin(getSessionID(), Users.RoleType.admin));
            return service.resetUserPassword(entity);
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN).build();
        } catch (CreateException e) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        
    }
    
    @PUT
    @Path("{id}")
    @Consumes({MediaType.APPLICATION_JSON})
    public Response editPassword(@PathParam("id") Long id, String p) {

        try {
            LoginUtil.check(usersDAO.checkLogin(getSessionID()));
            Users u = usersDAO.find(id);
            u.setPassword(Utility.hashPassword(p));
            return Response.ok().build();
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN).build();
        } catch (NoResultException e) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

    }

    @DELETE
    @Path("{id}")
    public Response remove(@PathParam("id") Long id) {
        
        try {   
            LoginUtil.check(usersDAO.checkLogin(getSessionID(), Users.RoleType.projectmanager));
            service.removeUser(usersDAO.find(id));
            return Response.status(Response.Status.OK).build();
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN).build();
        } catch (NoResultException | CreateException e) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public Response getUsers() {
        
        try {   
            LoginUtil.check(usersDAO.checkLogin(getSessionID(), Users.RoleType.projectmanager));
            
            List<Users> list = usersDAO.getAllUsersAscending();
            
            return Response.ok(mapper.writerWithView(View.Users.class)
                                        .withRootName("users")
                                        .writeValueAsString(list))
                            .build();
        } catch (JsonProcessingException ex) {
            Logger.getLogger(UserFacadeREST.class.getName()).log(Level.SEVERE, null, ex);
            return Response.serverError().build();
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
    }
    
}
