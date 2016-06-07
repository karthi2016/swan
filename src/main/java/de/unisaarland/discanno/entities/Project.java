/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.unisaarland.discanno.entities;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.voodoodyne.jackson.jsog.JSOGGenerator;
import de.unisaarland.discanno.rest.view.View;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.*;

/**
 * The Entity Project represents a set of documents and has a unique name.
 * 
 * @author Timo Guehring
 */
@Entity
@JsonIdentityInfo(generator=JSOGGenerator.class)
@NamedQueries({
    @NamedQuery(
        name = Project.QUERY_FIND_ALL,
        query = "SELECT DISTINCT p " +
                "FROM Project p " +
                "LEFT JOIN FETCH p.documents " +
                "LEFT JOIN FETCH p.projectManager " +
                "LEFT JOIN FETCH p.watchingUsers " +
                "LEFT JOIN FETCH p.users " +
                "LEFT JOIN FETCH p.scheme "
    )
})
public class Project extends BaseEntity {

    /**
     * Named query identifier for "find all".
     */
    public static final String QUERY_FIND_ALL = "Project.QUERY_FIND_ALL";

    @JsonView({ View.Projects.class, View.Documents.class })
    @Column(name = "Name", unique = true)
    private String name;
    
    @JsonView({ View.Projects.class })
    @OneToMany(mappedBy = "project",
                cascade = { CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE },
                fetch = FetchType.LAZY)
    private Set<Document> documents = new HashSet<>();
    
    @JsonView({ View.Projects.class })
    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE }, fetch = FetchType.LAZY)
    @JoinTable(
        name="PROJECTS_MANAGER",
        joinColumns={@JoinColumn(name="PROJECT_ID", referencedColumnName="id")},
        inverseJoinColumns={@JoinColumn(name="MANAGER_ID", referencedColumnName="id")})
    private Set<Users> projectManager = new HashSet<>();
    
    @JsonView({ View.Projects.class })
    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE }, fetch = FetchType.LAZY)
    @JoinTable(
        name="PROJECTS_WATCHINGUSERS",
        joinColumns={@JoinColumn(name="PROJECT_ID", referencedColumnName="id")},
        inverseJoinColumns={@JoinColumn(name="WATCHINGUSER_ID", referencedColumnName="id")})
    private Set<Users> watchingUsers = new HashSet<>();
    
    @JsonView({ View.Projects.class })
    @ManyToMany(mappedBy = "projects",
                cascade = { CascadeType.PERSIST, CascadeType.MERGE },
                fetch = FetchType.LAZY)
    private Set<Users> users = new HashSet<>();
    
    @JsonView({ View.Projects.class })
    @ManyToOne(cascade = { CascadeType.PERSIST, CascadeType.MERGE },
                fetch = FetchType.LAZY)
    @JoinColumn(name="Scheme", nullable = false)
    private Scheme scheme;

    
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Document> getDocuments() {
        return documents;
    }

    public void setDocuments(Set<Document> documents) {
        this.documents = documents;
    }
    
    public void addDocuments(Document document) {
        this.documents.add(document);
    }
    
    public void removeDocuments(Document document) {
        this.documents.remove(document);
    }

    public Set<Users> getUsers() {
        return users;
    }

    public void setUsers(Set<Users> users) {
        this.users = users;
    }
    
    public void addUsers(Users users) {
        this.users.add(users);
    }

    public void removeUsers(Users users) {
        this.users.remove(users);
    }

    public Set<Users> getProjectManager() {
        return projectManager;
    }

    public void setProjectManager(Set<Users> projectManager) {
        this.projectManager = projectManager;
    }
    
    public void addProjectManager(Users users) {
        this.projectManager.add(users);
    }
    
    public void removeProjectManager(Users users) {
        this.projectManager.remove(users);
    }

    public Set<Users> getWatchingUsers() {
        return watchingUsers;
    }

    public void setWatchingUsers(Set<Users> watchingUsers) {
        this.watchingUsers = watchingUsers;
    }
    
    public void addWatchingUsers(Users user) {
        this.watchingUsers.add(user);
    }
    
    public void removeWatchingUser(Users user) {
        this.watchingUsers.remove(user);
    }

    public Scheme getScheme() {
        return scheme;
    }

    public void setScheme(Scheme scheme) {
        this.scheme = scheme;
    }
    
}
